const bubbles = ['one', 'two', 'three', 'four', 'five', 'six'];

export function LoginBackground() {
  return <div className="login-background" aria-hidden="true">
    {bubbles.map(bubble => <span key={bubble} className={`login-bubble login-bubble--${bubble}`} />)}
  </div>;
}
