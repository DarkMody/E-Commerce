import Icon from "../icons/icons";
import { CONTACT, gmailCompose, whatsappLink } from "../../contactInfo";
import "./footer.css";

const TAGLINE = "A full-stack portfolio project";

// Your details live in src/contactInfo.js. To add a link here, add one more line to this list.
const LINKS = [
  { label: "GitHub", href: CONTACT.github, icon: "github" },
  { label: "LinkedIn", href: CONTACT.linkedin, icon: "linkedin" },
  {
    label: "Email",
    href: gmailCompose(CONTACT.email, "Hello from the DarkZon project"),
    icon: "mail",
  },
  {
    label: "WhatsApp",
    href: whatsappLink("Hi, I'm contacting you from the DarkZon project"),
    icon: "whatsapp",
  },
];

function Footer() {
  return (
    <footer className="dz-footer">
      <p className="dz-footer__brand">DarkZon</p>
      <p className="dz-footer__tagline">{TAGLINE}</p>

      <ul className="dz-footer__links">
        {LINKS.map(({ label, href, icon }) => (
          <li key={label}>
            <a
              className="dz-footer__link"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} (opens in a new tab)`}
              title={label}
            >
              <Icon name={icon} />
            </a>
          </li>
        ))}
      </ul>

      <p className="dz-footer__bottom">
        © {new Date().getFullYear()} DarkZon · Built by {CONTACT.developerName}
      </p>
    </footer>
  );
}

export default Footer;
