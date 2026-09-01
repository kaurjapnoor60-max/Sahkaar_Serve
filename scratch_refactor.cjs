const fs = require('fs');
let code = fs.readFileSync('src/components/WorkerDashboard.tsx', 'utf8');

// 1. Remove the global RAJESH definition
code = code.replace(/const RAJESH = WORKERS\[0\]; \/\/ Rajesh Kumar\n/, '');

// 2. Replace all instances of RAJESH. with worker.
code = code.replace(/RAJESH\./g, 'worker.');
code = code.replace(/RAJESH/g, 'worker');

// 3. Add worker prop to subcomponents
const comps = ['WorkerHome', 'WorkerJobs', 'WorkerEarnings', 'CooperativeEconomics', 'WorkerWelfare', 'WorkerSkills', 'WorkerAvailability'];
comps.forEach(c => {
  code = code.replace(new RegExp('function ' + c + '\\\\((.*?)\\\\) {'), (match, p1) => {
    if (p1.trim() === '') return 'function ' + c + '({ worker }: { worker: any }) {';
    if (p1.includes('isPending')) return 'function ' + c + '({ onNavigate, isPending, worker }: { onNavigate: (id: string) => void; isPending: boolean; worker: any }) {';
    return 'function ' + c + '({ worker }: { worker: any }) {';
  });
  
  // Replace the invocations in WorkerDashboard
  if (c === 'WorkerHome') {
    code = code.replace(new RegExp('<' + c + ' onNavigate={setActive} isPending={isPending} />'), '<' + c + ' onNavigate={setActive} isPending={isPending} worker={activeWorker} />');
  } else {
    code = code.replace(new RegExp('<' + c + ' />'), '<' + c + ' worker={activeWorker} />');
  }
});

// 4. Update the WorkerDashboard component to fetch data
const fetchHook = `
  const [activeWorker, setActiveWorker] = useState<any>(null);
  useEffect(() => {
    workersApi.getMe().then(data => {
      if (data) {
        setActiveWorker({
           id: data._id,
           name: data.name,
           trade: data.serviceCategory,
           rating: data.rating || 4.8,
           experienceYears: data.experienceYears || 3,
           initials: data.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2),
           available: data.availabilityStatus === 'AVAILABLE',
           earningsMonth: 24500,
           jobsCompleted: 156,
           currentWorkload: data.currentWorkload || 60,
           recentJobs: data.recentJobs || 12,
        });
      }
    }).catch(console.error);
  }, []);
`;

code = code.replace("const [active, setActive] = useState('home');", "const [active, setActive] = useState('home');\n" + fetchHook + "\n  if (!activeWorker) return <div className=\"flex h-screen items-center justify-center\"><div className=\"text-ink-500\">Loading dashboard...</div></div>;");

// Fix WORKER_USER in the top-level
code = code.replace(/const WORKER_USER = { \.\.\.WORKER, name: workerName, initials: workerInitials };/, "const WORKER_USER = { ...WORKER, name: activeWorker.name, initials: activeWorker.initials };");

// Inject imports
if (!code.includes('workersApi')) {
  code = code.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';\nimport { workersApi } from '@/lib/api';");
} else if (!code.includes('useEffect')) {
  code = code.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';");
}

fs.writeFileSync('src/components/WorkerDashboard.tsx', code);
console.log('WorkerDashboard updated');
