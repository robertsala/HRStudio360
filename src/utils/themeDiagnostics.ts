export const runThemeDiagnostics = () => {
  console.log('=== THEME DIAGNOSTICS START ===');

  // Check localStorage
  const localStorageTheme = localStorage.getItem('theme');
  console.log('1. localStorage theme:', localStorageTheme);

  // Check HTML element classList
  const htmlClassList = Array.from(document.documentElement.classList);
  console.log('2. HTML classList:', htmlClassList);
  console.log('3. Has "dark" class:', document.documentElement.classList.contains('dark'));

  // Check computed background color of body
  const bodyBg = window.getComputedStyle(document.body).backgroundColor;
  console.log('4. Body background color:', bodyBg);

  // Check if Tailwind dark mode is working
  const testDiv = document.createElement('div');
  testDiv.className = 'bg-white dark:bg-gray-900';
  document.body.appendChild(testDiv);
  const testBg = window.getComputedStyle(testDiv).backgroundColor;
  document.body.removeChild(testDiv);
  console.log('5. Test div bg color (should be white or dark):', testBg);

  // Check media query for prefers-color-scheme
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  console.log('6. OS/Browser prefers dark mode:', prefersDark);

  // Check all Supabase keys
  const allKeys = Object.keys(localStorage);
  const supabaseKeys = allKeys.filter(k => k.startsWith('sb-') || k.includes('supabase'));
  console.log('7. Supabase localStorage keys:', supabaseKeys);

  console.log('=== THEME DIAGNOSTICS END ===');

  return {
    localStorage: localStorageTheme,
    hasDarkClass: document.documentElement.classList.contains('dark'),
    htmlClasses: htmlClassList,
    bodyBg,
    testBg,
    prefersDark,
    supabaseKeys
  };
};
