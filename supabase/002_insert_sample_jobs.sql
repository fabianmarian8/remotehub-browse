-- Insert sample job listings for testing
-- This will populate the jobs table with some example data

INSERT INTO public.jobs (
  title,
  company,
  description,
  requirements,
  location,
  job_type,
  category,
  tags,
  salary_min,
  salary_max,
  salary_currency,
  apply_url,
  company_url,
  source,
  published_at,
  is_featured,
  is_active
) VALUES
(
  'Senior Full Stack Developer',
  'TechCorp International',
  'We are looking for an experienced Full Stack Developer to join our remote team. You will be working on cutting-edge web applications using React, Node.js, and PostgreSQL.',
  'Requirements:
• 5+ years of experience with JavaScript/TypeScript
• Strong knowledge of React and Node.js
• Experience with PostgreSQL and database design
• Excellent communication skills
• Self-motivated and able to work independently',
  'Worldwide',
  'Full-time',
  'Engineering',
  ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'TypeScript'],
  80000,
  120000,
  'USD',
  'https://example.com/apply/senior-fullstack',
  'https://techcorp.example.com',
  'manual',
  NOW() - INTERVAL '1 day',
  true,
  true
),
(
  'UI/UX Designer',
  'Creative Studio Pro',
  'Join our design team to create beautiful and intuitive user interfaces for web and mobile applications. We value creativity and user-centered design.',
  'Requirements:
• 3+ years of UI/UX design experience
• Proficiency in Figma and Adobe Creative Suite
• Strong portfolio demonstrating user-centered design
• Experience with design systems
• Understanding of accessibility best practices',
  'Europe',
  'Full-time',
  'Design',
  ARRAY['Figma', 'UI Design', 'UX Design', 'Adobe XD', 'Prototyping'],
  60000,
  90000,
  'EUR',
  'https://example.com/apply/ui-ux-designer',
  'https://creativestudio.example.com',
  'manual',
  NOW() - INTERVAL '2 days',
  false,
  true
),
(
  'DevOps Engineer',
  'CloudScale Solutions',
  'We are seeking a talented DevOps Engineer to help us build and maintain our cloud infrastructure. Experience with AWS, Docker, and Kubernetes is essential.',
  'Requirements:
• 4+ years of DevOps experience
• Strong knowledge of AWS services
• Experience with Docker and Kubernetes
• Proficiency in Infrastructure as Code (Terraform/CloudFormation)
• CI/CD pipeline experience (GitHub Actions, GitLab CI)',
  'North America',
  'Full-time',
  'Engineering',
  ARRAY['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
  90000,
  130000,
  'USD',
  'https://example.com/apply/devops-engineer',
  'https://cloudscale.example.com',
  'manual',
  NOW() - INTERVAL '3 days',
  true,
  true
),
(
  'Content Marketing Manager',
  'Growth Marketing Co',
  'Lead our content marketing strategy and create compelling content that drives engagement and growth. Perfect for someone passionate about storytelling and data-driven marketing.',
  'Requirements:
• 3+ years in content marketing or related role
• Excellent writing and editing skills
• SEO knowledge and experience
• Analytics and data interpretation skills
• Experience with content management systems',
  'Worldwide',
  'Full-time',
  'Marketing',
  ARRAY['Content Marketing', 'SEO', 'Copywriting', 'Analytics', 'Strategy'],
  55000,
  85000,
  'USD',
  'https://example.com/apply/content-marketing',
  'https://growthmarketing.example.com',
  'manual',
  NOW() - INTERVAL '5 days',
  false,
  true
),
(
  'Python Backend Developer',
  'DataFlow Systems',
  'Join our backend team to build scalable APIs and data processing pipelines using Python, FastAPI, and modern cloud technologies.',
  'Requirements:
• 3+ years of Python development experience
• Experience with FastAPI or Django
• Knowledge of SQL and NoSQL databases
• Understanding of RESTful API design
• Experience with async programming',
  'Asia',
  'Contract',
  'Engineering',
  ARRAY['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'REST API'],
  70000,
  100000,
  'USD',
  'https://example.com/apply/python-backend',
  'https://dataflow.example.com',
  'manual',
  NOW() - INTERVAL '1 week',
  false,
  true
),
(
  'Customer Success Specialist',
  'SaaS Innovations Ltd',
  'Help our customers succeed by providing exceptional support and guidance. You will be the main point of contact for our enterprise clients.',
  'Requirements:
• 2+ years in customer success or account management
• Excellent communication and problem-solving skills
• Technical aptitude and ability to learn software quickly
• Experience with CRM systems
• Empathy and customer-first mindset',
  'Worldwide',
  'Full-time',
  'Customer Support',
  ARRAY['Customer Success', 'Support', 'CRM', 'Communication', 'SaaS'],
  45000,
  65000,
  'USD',
  'https://example.com/apply/customer-success',
  'https://saas-innovations.example.com',
  'manual',
  NOW() - INTERVAL '4 days',
  false,
  true
),
(
  'Senior Product Manager',
  'InnovateTech',
  'Drive product strategy and execution for our flagship products. Work with engineering, design, and business teams to deliver exceptional user experiences.',
  'Requirements:
• 5+ years of product management experience
• Strong analytical and problem-solving skills
• Experience with agile methodologies
• Data-driven decision making
• Excellent stakeholder management skills',
  'US/Canada',
  'Full-time',
  'Product',
  ARRAY['Product Management', 'Agile', 'Strategy', 'Analytics', 'Leadership'],
  100000,
  150000,
  'USD',
  'https://example.com/apply/senior-pm',
  'https://innovatetech.example.com',
  'manual',
  NOW() - INTERVAL '2 days',
  true,
  true
),
(
  'Data Analyst',
  'Analytics Plus',
  'Transform data into actionable insights. Work with stakeholders across the organization to drive data-informed decisions.',
  'Requirements:
• 2+ years of data analysis experience
• Proficiency in SQL and Python
• Experience with BI tools (Tableau, Power BI, or similar)
• Statistical analysis skills
• Strong communication skills to present findings',
  'Worldwide',
  'Part-time',
  'Data',
  ARRAY['SQL', 'Python', 'Tableau', 'Statistics', 'Data Analysis'],
  50000,
  75000,
  'USD',
  'https://example.com/apply/data-analyst',
  'https://analyticsplus.example.com',
  'manual',
  NOW() - INTERVAL '6 days',
  false,
  true
);

-- Verify the insert
SELECT COUNT(*) as total_jobs FROM public.jobs WHERE is_active = true;
