// akin to jQuery's ready method
export default new Promise((resolve) => {
  if (document.readyState === 'interactive') {
    resolve();
  } else {
    document.addEventListener('DOMContentLoaded', resolve);
  }
});
