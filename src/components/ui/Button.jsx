import { Link } from 'react-router-dom';
import styles from './Button.module.css';

export default function Button({ children, to, href, variant = 'primary', className = '', ...rest }) {
  const cls = `${styles.btn} ${styles[variant] || ''} ${className}`.trim();
  if (to)   return <Link to={to} className={cls} {...rest}>{children}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{children}</a>;
  return <button type="button" className={cls} {...rest}>{children}</button>;
}