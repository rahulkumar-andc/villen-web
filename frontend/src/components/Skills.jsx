import React from 'react';
import { motion } from 'framer-motion';
import './Skills.css';

const skillCategories = [
  {
    name: 'Backend',
    skills: [
      { name: 'Python', level: 95 },
      { name: 'Django', level: 90 },
      { name: 'REST APIs', level: 88 },
      { name: 'PostgreSQL', level: 80 }
    ]
  },
  {
    name: 'Frontend',
    skills: [
      { name: 'React', level: 90 },
      { name: 'JavaScript', level: 85 },
      { name: 'CSS/SASS', level: 82 },
      { name: 'Vite', level: 78 }
    ]
  },
  {
    name: 'Security',
    skills: [
      { name: 'Penetration Testing', level: 85 },
      { name: 'Network Security', level: 80 },
      { name: 'OWASP', level: 75 },
      { name: 'Cryptography', level: 70 }
    ]
  },
  {
    name: 'DevOps',
    skills: [
      { name: 'Docker', level: 75 },
      { name: 'Linux', level: 85 },
      { name: 'Git', level: 90 },
      { name: 'CI/CD', level: 70 }
    ]
  }
];

const SkillBar = ({ skill, index }) => {
  return (
    <div className="skill-item">
      <div className="skill-header">
        <span className="skill-name">{skill.name}</span>
        <span className="skill-percentage">{skill.level}%</span>
      </div>
      <div className="skill-bar-bg">
        <motion.div
          className="skill-bar-fill"
          initial={{ width: 0 }}
          whileInView={{ width: `${skill.level}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: index * 0.1 }}
        />
      </div>
    </div>
  );
};

const Skills = () => {
  return (
    <section className="skills-section">
      <h2 className="section-title glitch" data-text="Technical Arsenal">Technical Arsenal</h2>
      <div className="skills-grid">
        {skillCategories.map((category, catIndex) => (
          <div key={category.name} className="skill-category">
            <h3 className="category-title">{category.name}</h3>
            {category.skills.map((skill, skillIndex) => (
              <SkillBar 
                key={skill.name} 
                skill={skill} 
                index={skillIndex} 
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Skills;

