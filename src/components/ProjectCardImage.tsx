import React, { useState, useEffect } from 'react';

interface ProjectCardImageProps {
  project: {
    id?: string;
    title?: string;
    image?: string;
    category?: string;
  };
  className?: string;
  style?: React.CSSProperties;
}

const fallbackImages: Record<string, string> = {
  'dairy-management': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800',
  'agriculture-billing': 'https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=800&auto=format&fit=crop',
  'mess-management': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop',
  'medical-prescription': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800',
  'furniture-management': 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800&auto=format&fit=crop',
  'school-erp': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800&auto=format&fit=crop',
  'cricket-scoreboard': 'https://images.unsplash.com/photo-1624526261102-98fdc0c0749e?auto=format&fit=crop&q=80&w=800',
  'cricket-auction': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
  'ganpati-mandal': 'https://images.unsplash.com/photo-1567591414240-e248b61c4fc9?auto=format&fit=crop&q=80&w=800',
};

export const ProjectCardImage: React.FC<ProjectCardImageProps> = ({ project, className = "", style }) => {
  const getInitialImage = () => {
    // If we have an override set for this specific ID in fallbacks, and the project image is empty or uses the old broken Unsplash photo
    if (project.id && fallbackImages[project.id]) {
      const isOldUnsplash = project.image?.includes('photo-1528498033373-3c6c08e83363') || 
                            project.image?.includes('photo-1576091160550-2173dad99901') || 
                            project.image?.includes('photo-1531415080290-bc9854593f6f') || 
                            project.image?.includes('photo-1540747737956-37872de719e0');
      
      if (!project.image || project.image.trim() === "" || isOldUnsplash) {
        return fallbackImages[project.id];
      }
    }

    if (project.image && project.image.trim() !== '') {
      return project.image;
    }

    if (project.id && fallbackImages[project.id]) {
      return fallbackImages[project.id];
    }

    // Category fallbacks
    if (project.category === 'ai') {
      return 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800';
    }
    if (project.category === 'app') {
      return 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800';
    }
    return 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800';
  };

  const [src, setSrc] = useState(getInitialImage());

  const handleError = () => {
    // If image fails to load, fall back to our premium list or general backup
    if (project.id && fallbackImages[project.id] && src !== fallbackImages[project.id]) {
      setSrc(fallbackImages[project.id]);
    } else {
      setSrc('https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800');
    }
  };

  useEffect(() => {
    setSrc(getInitialImage());
  }, [project.image, project.id]);

  return (
    <img 
      src={src} 
      alt={project.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
      style={style}
    />
  );
};
