export interface Post {
  id: string;
  type: 'BLOG' | 'POST' | 'QUESTION' | string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorDepartment: string;
  title: string;
  content: string;
  category: string;
  upvotes: number;
  answers: number;
  hasAcceptedAnswer: boolean;
  createdAt: string;
  tags: string[];
  media?: {
    url: string;
    type: string;
    mime_type: string;
  }[];
}

export const categories = [
  'All',
  'AI & ML',
  'Web Development',
  'Core Engineering',
  'Research',
  'Career Guidance',
  'Project Help',
  'Study Resources',
  'Other',
];


export const mockPosts: Post[] = [
  {
    id: '1',
    authorId: '2',
    authorName: 'Raj Patel',
    authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    authorDepartment: 'Data Science',
    title: 'Best approach for distributed training with PyTorch?',
    type: 'QUESTION',
    content: 'I\'m working on a distributed ML pipeline and need to scale training across multiple GPUs. Should I use PyTorch DDP or DeepSpeed? Any experiences with either approach for NLP workloads?',
    category: 'AI & ML',
    upvotes: 23,
    answers: 5,
    hasAcceptedAnswer: true,
    createdAt: '2h ago',
    tags: ['PyTorch', 'Distributed Computing', 'NLP'],
  },
  {
    id: '2',
    authorId: '3',
    authorName: 'Emily Rodriguez',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    authorDepartment: 'Software Engineering',
    title: 'React Native vs Flutter for academic project?',
    type: 'QUESTION',
    content: 'Starting a campus app project and debating between React Native and Flutter. Our team has strong JS experience. What are the trade-offs for a medium-complexity app with real-time features?',
    category: 'Web Development',
    upvotes: 15,
    answers: 8,
    hasAcceptedAnswer: false,
    createdAt: '4h ago',
    tags: ['React Native', 'Flutter', 'Mobile Dev'],
  },
  {
    id: '3',
    authorId: '1',
    authorName: 'Dr. Sarah Chen',
    authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    authorDepartment: 'Computer Science',
    title: 'Tips for writing your first research paper',
    type: 'BLOG',
    content: 'Sharing some structured advice for students writing their first academic paper. Focus on: 1) Clear problem statement, 2) Thorough literature review, 3) Reproducible methodology, 4) Honest evaluation. Happy to mentor anyone going through the process.',
    category: 'Research',
    upvotes: 47,
    answers: 12,
    hasAcceptedAnswer: true,
    createdAt: '1d ago',
    tags: ['Research', 'Academic Writing', 'Mentorship'],
  },
  {
    id: '4',
    authorId: '5',
    authorName: 'Priya Sharma',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    authorDepartment: 'Computer Science',
    title: 'Understanding zero-knowledge proofs for blockchain',
    type: 'BLOG',
    content: 'I\'ve been studying ZKPs for my decentralized identity project. Here\'s a simplified breakdown of how zk-SNARKs work and why they matter for privacy-preserving verification systems.',
    category: 'Core Engineering',
    upvotes: 19,
    answers: 3,
    hasAcceptedAnswer: false,
    createdAt: '1d ago',
    tags: ['Blockchain', 'Cryptography', 'Privacy'],
  },
  {
    id: '5',
    authorId: '6',
    authorName: 'Michael Wright',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    authorDepartment: 'Computer Science',
    title: 'Looking for collaborators: Medical image analysis project',
    type: 'POST',
    content: 'Seeking 2-3 students interested in applying deep learning to medical imaging. The project involves building a CNN-based system for detecting anomalies in X-ray images. Experience with PyTorch and image processing preferred.',
    category: 'Project Help',
    upvotes: 31,
    answers: 7,
    hasAcceptedAnswer: false,
    createdAt: '2d ago',
    tags: ['Computer Vision', 'Healthcare', 'Deep Learning'],
  },
];
