import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Briefcase, GraduationCap, Award } from 'lucide-react';
import './Timeline.css';

const timelineEvents = [
  {
    year: '2024',
    month: 'Present',
    type: 'work',
    icon: Briefcase,
    title: 'Security Researcher',
    organization: 'Independent',
    description: 'Conducting security research, developing open-source security tools, and contributing to the cybersecurity community.'
  },
  {
    year: '2023',
    month: 'Dec',
    type: 'achievement',
    icon: Award,
    title: 'Shadow Layer Launch',
    organization: 'Personal Project',
    description: 'Launched the complete Shadow Layer platform with full-stack implementation and cyber-themed design.'
  },
  {
    year: '2023',
    month: 'Jun',
    type: 'education',
    icon: Graduation,
    title: 'Advanced Penetration Testing',
    organization: 'Security Certification',
    description: 'Completed advanced certification in penetration testing and vulnerability assessment.'
  },
  {
    year: '2022',
    month: 'Jan',
    type: 'work',
    icon: Briefcase,
    title: 'Full Stack Developer',
    organization: 'Tech Company',
    description: 'Developed and maintained scalable web applications using Python/Django and React.'
  },
  {
    year: '2021',
    month: 'Sep',
    type: 'education',
    icon: Graduation,
    title: 'Computer Science Degree',
    organization: 'University',
    description: 'Graduated with focus on cybersecurity and software engineering.'
  }
];

const TimelineItem = ({ event, index }) => {
  const Icon = event.icon;

  return (
    <motion.div
      className={`timeline - item ${event.type} `}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="timeline-marker">
        <Icon size={20} />
      </div>
      <div className="timeline-content">
        <div className="timeline-header">
          <span className="timeline-date">
            <Calendar size={14} />
            {event.month} {event.year}
          </span>
          <span className={`timeline - type ${event.type} `}>{event.type}</span>
        </div>
        <h3 className="timeline-title">{event.title}</h3>
        <p className="timeline-org">{event.organization}</p>
        <p className="timeline-desc">{event.description}</p>
      </div>
    </motion.div>
  );
};

const Timeline = () => {
  return (
    <section className="timeline-section">
      <h2 className="section-title glitch" data-text="Mission Log">Mission Log</h2>
      <div className="timeline-container">
        <div className="timeline-line" />
        {timelineEvents.map((event, index) => (
          <TimelineItem key={`${event.year} -${event.month} -${index} `} event={event} index={index} />
        ))}
      </div>
    </section>
  );
};

export default Timeline;

