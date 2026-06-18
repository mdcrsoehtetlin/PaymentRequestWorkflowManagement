
export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-4 px-6 text-center border-t border-slate-200 bg-white text-sm text-slate-500">
      &copy; {currentYear} Payment Request Workflow Management System. All rights reserved.
    </footer>
  );
}
