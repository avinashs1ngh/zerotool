import React from 'react';
import styles from './Card.module.scss';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, description, className = '', children, ...props }) => {
  return (
    <motion.div 
      className={`${styles.card} ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      {...props}
    >
      {(title || description) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {description && <p className={styles.desc}>{description}</p>}
        </div>
      )}
      <div className={styles.content}>
        {children}
      </div>
    </motion.div>
  );
};
