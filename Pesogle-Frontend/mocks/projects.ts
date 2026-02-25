export interface Project {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  members: { id: string; name: string; role: string; avatar: string }[];
  status: 'active' | 'completed' | 'planning';
  tags: string[];
  tasks: { id: string; title: string; status: 'todo' | 'in_progress' | 'done'; assignee: string }[];
  createdAt: string;
}

export const mockProjects: Project[] = [
  {
    id: '1',
    title: 'AI-Powered Study Planner',
    description: 'Building an intelligent study planning system that uses ML to optimize study schedules based on learning patterns, exam dates, and course difficulty.',
    ownerId: 'current',
    ownerName: 'Alex Thompson',
    members: [
      { id: 'current', name: 'Alex Thompson', role: 'Lead', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
      { id: '3', name: 'Emily Rodriguez', role: 'Frontend', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' },
      { id: '2', name: 'Raj Patel', role: 'ML Engineer', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face' },
    ],
    status: 'active',
    tags: ['Machine Learning', 'React Native', 'Python'],
    tasks: [
      { id: 't1', title: 'Design data model', status: 'done', assignee: 'Alex Thompson' },
      { id: 't2', title: 'Build recommendation engine', status: 'in_progress', assignee: 'Raj Patel' },
      { id: 't3', title: 'Create mobile UI', status: 'in_progress', assignee: 'Emily Rodriguez' },
      { id: 't4', title: 'User testing', status: 'todo', assignee: 'Alex Thompson' },
    ],
    createdAt: '2 weeks ago',
  },
  {
    id: '2',
    title: 'Sentiment Analysis Research',
    description: 'Research project analyzing sentiment in academic reviews using transformer-based models. Aiming for publication in ACL.',
    ownerId: 'current',
    ownerName: 'Alex Thompson',
    members: [
      { id: 'current', name: 'Alex Thompson', role: 'Researcher', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
      { id: '1', name: 'Dr. Sarah Chen', role: 'Advisor', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face' },
    ],
    status: 'active',
    tags: ['NLP', 'Research', 'Transformers'],
    tasks: [
      { id: 't5', title: 'Literature review', status: 'done', assignee: 'Alex Thompson' },
      { id: 't6', title: 'Data collection', status: 'done', assignee: 'Alex Thompson' },
      { id: 't7', title: 'Model training', status: 'in_progress', assignee: 'Alex Thompson' },
      { id: 't8', title: 'Write paper draft', status: 'todo', assignee: 'Alex Thompson' },
    ],
    createdAt: '1 month ago',
  },
  {
    id: '3',
    title: 'Campus IoT Monitoring System',
    description: 'Deploying IoT sensors across campus to monitor environmental conditions and optimize energy usage using edge computing.',
    ownerId: '4',
    ownerName: 'Prof. James Okafor',
    members: [
      { id: '4', name: 'Prof. James Okafor', role: 'Lead', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
      { id: '5', name: 'Priya Sharma', role: 'Security', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face' },
    ],
    status: 'planning',
    tags: ['IoT', 'Edge Computing', 'Embedded Systems'],
    tasks: [
      { id: 't9', title: 'Sensor selection', status: 'in_progress', assignee: 'Prof. James Okafor' },
      { id: 't10', title: 'Security audit plan', status: 'todo', assignee: 'Priya Sharma' },
      { id: 't11', title: 'Edge inference setup', status: 'todo', assignee: 'Prof. James Okafor' },
    ],
    createdAt: '3 days ago',
  },
];
