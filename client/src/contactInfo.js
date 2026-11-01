export const CONTACT = {
  developerName: "Mahmoud Mohamed",
  email: "modyandmody12345@gmail.com",
  whatsapp: { number: "201154790156", display: "+20 115 479 0156" },
  github: "https://github.com/DarkMody",
  linkedin: "https://www.linkedin.com/in/mahmoud-mohamed-194441348/",
  replyTime: "24 hours",
};

export const gmailCompose = (to, subject = "", body = "") =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}` +
  `&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const mailtoLink = (to, subject = "", body = "") =>
  `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const whatsappLink = (message = "") =>
  `https://wa.me/${CONTACT.whatsapp.number}` +
  (message ? `?text=${encodeURIComponent(message)}` : "");
