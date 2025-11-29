"use client";
import LocaleNav from './LocaleNav';
import DarkModeToggle from './DarkModeToggle';
import styles from './site-header.module.css';

export default function SiteHeader(){
  return (
    <header className={styles.siteHeader}>
      <LocaleNav />
      <DarkModeToggle />
    </header>
  );
}