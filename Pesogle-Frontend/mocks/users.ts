export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  domains: string[];
  skills: string[];
  projects: string[];
  goals: string[];
  bio: string;
  avatar: string;
  matchPercentage: number;
  matchReason: string;
  academicScore: number;
  role: 'student' | 'mentor' | 'researcher';
}

export const currentUser: User = {
  id: 'current',
  name: 'Alex Thompson',
  email: 'alex.thompson@university.edu',
  department: 'Computer Science',
  year: '3rd Year',
  domains: ['Artificial Intelligence', 'Machine Learning', 'Data Science'],
  skills: ['Python', 'TensorFlow', 'React Native', 'TypeScript', 'SQL'],
  projects: ['AI-Powered Study Planner', 'Sentiment Analysis Research'],
  goals: ['Complete ML Research Paper', 'Build Open-Source AI Tool'],
  bio: 'Computer Science student passionate about AI and machine learning. Currently working on NLP research and building developer tools.',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  matchPercentage: 0,
  matchReason: '',
  academicScore: 87,
  role: 'student',
};

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@university.edu',
    department: 'Computer Science',
    year: 'Faculty',
    domains: ['Machine Learning', 'Natural Language Processing'],
    skills: ['Python', 'PyTorch', 'Research Methods', 'Academic Writing'],
    projects: ['NLP for Low-Resource Languages', 'AI Ethics Framework'],
    goals: ['Mentoring junior researchers', 'Publishing in top venues'],
    bio: 'Associate Professor specializing in NLP and ML. 10+ years of research experience with 50+ publications.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    matchPercentage: 94,
    matchReason: 'Strong overlap in ML & NLP. Can guide your research paper.',
    academicScore: 96,
    role: 'mentor',
  },
  {
    id: '2',
    name: 'Raj Patel',
    email: 'raj.patel@university.edu',
    department: 'Data Science',
    year: '4th Year',
    domains: ['Data Science', 'Machine Learning', 'Cloud Computing'],
    skills: ['Python', 'AWS', 'Spark', 'TensorFlow', 'Docker'],
    projects: ['Distributed ML Pipeline', 'Real-Time Analytics Dashboard'],
    goals: ['Industry placement at FAANG', 'Open-source contribution'],
    bio: 'Data Science senior with strong engineering skills. Building scalable ML systems and contributing to open-source.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    matchPercentage: 88,
    matchReason: 'Shared interest in ML pipelines & open-source tools.',
    academicScore: 82,
    role: 'student',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@university.edu',
    department: 'Software Engineering',
    year: '2nd Year',
    domains: ['Web Development', 'Mobile Development', 'UI/UX'],
    skills: ['React', 'TypeScript', 'Figma', 'Node.js', 'Swift'],
    projects: ['Campus Navigation App', 'Study Group Matcher'],
    goals: ['Learn system design', 'Build portfolio projects'],
    bio: 'Software Engineering student focused on building user-centered applications. Love combining design thinking with code.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    matchPercentage: 76,
    matchReason: 'Complementary mobile dev skills for project collaboration.',
    academicScore: 79,
    role: 'student',
  },
  {
    id: '4',
    name: 'Prof. James Okafor',
    email: 'j.okafor@university.edu',
    department: 'Electrical Engineering',
    year: 'Faculty',
    domains: ['Embedded Systems', 'IoT', 'Artificial Intelligence'],
    skills: ['C/C++', 'FPGA', 'Edge AI', 'Research Methods'],
    projects: ['Edge AI for Healthcare', 'Smart Campus IoT Network'],
    goals: ['Cross-disciplinary research', 'Industry partnerships'],
    bio: 'Professor of EE with focus on bringing AI to edge devices. Passionate about practical applications of technology.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    matchPercentage: 71,
    matchReason: 'Edge AI expertise aligns with your AI interests.',
    academicScore: 94,
    role: 'mentor',
  },
  {
    id: '5',
    name: 'Priya Sharma',
    email: 'priya.s@university.edu',
    department: 'Computer Science',
    year: '3rd Year',
    domains: ['Cybersecurity', 'Blockchain', 'Cloud Computing'],
    skills: ['Python', 'Solidity', 'AWS', 'Penetration Testing'],
    projects: ['Decentralized Identity System', 'Vulnerability Scanner'],
    goals: ['Security research publication', 'Bug bounty expertise'],
    bio: 'CS student specializing in security. Working on blockchain-based identity systems and network security research.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    matchPercentage: 65,
    matchReason: 'Python expertise overlap. Potential collaboration on AI security.',
    academicScore: 85,
    role: 'student',
  },
  {
    id: '6',
    name: 'Michael Wright',
    email: 'm.wright@university.edu',
    department: 'Computer Science',
    year: 'PhD',
    domains: ['Computer Vision', 'Deep Learning', 'Robotics'],
    skills: ['Python', 'OpenCV', 'ROS', 'PyTorch', 'CUDA'],
    projects: ['Autonomous Navigation System', 'Medical Image Analysis'],
    goals: ['PhD completion', 'Research lab setup'],
    bio: 'PhD candidate researching computer vision for autonomous systems. Experienced in deep learning and real-time processing.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    matchPercentage: 82,
    matchReason: 'Deep learning expertise can enhance your ML research.',
    academicScore: 91,
    role: 'researcher',
  },
];

export const domains = [
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Web Development',
  'Mobile Development',
  'Cybersecurity',
  'Cloud Computing',
  'Blockchain',
  'IoT',
  'Computer Vision',
  'Natural Language Processing',
  'Robotics',
  'Software Engineering',
  'Database Systems',
  'UI/UX Design',
  'DevOps',
  'Embedded Systems',
  'Quantum Computing',
];

export const skillsList = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C',
  'React', 'React Native', 'Angular', 'Vue.js', 'Node.js',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras',
  'SQL', 'MongoDB', 'PostgreSQL', 'Redis',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
  'Git', 'Linux', 'Figma', 'Swift', 'Kotlin',
  'R', 'MATLAB', 'Spark', 'Hadoop',
  'OpenCV', 'ROS', 'Solidity', 'Go', 'Rust',
];
