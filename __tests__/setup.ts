/** Replace the jsdom body with the standard name + furigana input pair (or a custom layout). */
export function setup(html = '<input name="name" id="name"><input name="furigana" id="furigana">') {
  document.body.innerHTML = html;
}
