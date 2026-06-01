import "./footer.css";

function Footer() {
  return (
    <div className="footer p-5 d-flex justify-content-center align-items-center flex-column text-md-start">
      <h1 className="logo">DarkZon</h1>
      <p className="text-black-50 fs-3">
        Hope you had a good time get into these links for more info about the
        developer
      </p>
      <div className="links d-flex gap-4">
        <a
          target="_blank"
          href="https://github.com/DarkMody"
          className="fs-3 text-decoration-none"
        >
          <i className="fa-brands fa-github"></i>Github
        </a>
        <a
          target="_blank"
          href="https://www.linkedin.com/in/mahmoud-mohamed-194441348/"
          className="fs-3 text-decoration-none"
        >
          <i className="fa-brands fa-linkedin"></i>LinkedIn
        </a>
      </div>
    </div>
  );
}
export default Footer;
