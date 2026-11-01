import { useState, useId } from "react";
import Nav from "../../components/nav/nav";
import Footer from "../../components/footer/footer";
import Button from "../../components/button/button";
import Icon from "../../components/icons/icons";
import {
  CONTACT,
  gmailCompose,
  mailtoLink,
  whatsappLink,
} from "../../contactInfo";
import "./contact.css";

const SUBJECTS = ["Question about the project", "Feedback", "Other"];
const MIN_LENGTH = 10;
const MAX_LENGTH = 1000;
const DEFAULT_WHATSAPP_MESSAGE =
  "Hi, I'm contacting you from the DarkZon project";

function Contact() {
  const subjectId = useId();
  const messageId = useId();
  const messageHelpId = useId();

  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmed = message.trim();
  const messageError =
    touched && trimmed.length < MIN_LENGTH
      ? `Write at least ${MIN_LENGTH} characters`
      : undefined;

  // [DarkZon] prefix makes these emails easy to filter in your inbox
  const emailSubject = `[DarkZon] ${subject}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (trimmed.length < MIN_LENGTH) {
      window.toast("invalid", `Write at least ${MIN_LENGTH} characters`);
      return;
    }

    const tab = window.open(
      gmailCompose(CONTACT.email, emailSubject, trimmed),
      "_blank",
    );
    if (tab) {
      tab.opener = null; // the new tab can't control this page
      window.toast(
        "success",
        "Gmail opened in a new tab. Press Send to finish.",
      );
    } else {
      window.toast(
        "error",
        "Your browser blocked the new tab. Allow pop-ups, or use the mail app link.",
      );
    }
  };

  return (
    <>
      <Nav />
      <main className="contact-page container py-4 py-lg-5">
        <header className="mb-4 mb-lg-5">
          <h1 className="contact-title mb-2">Contact</h1>
          <p className="text-secondary mb-0">
            Have a question, an idea or a job opportunity? Choose how you want
            to reach me. I usually reply within {CONTACT.replyTime}.
          </p>
        </header>

        <div className="row g-4">
          {/* ---------- Option 1: email ---------- */}
          <div className="col-lg-7">
            <form
              className="contact-card h-100 d-flex flex-column gap-4"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="d-flex align-items-center gap-3">
                <span className="contact-card__icon">
                  <Icon name="mail" size={22} />
                </span>
                <div>
                  <h2 className="h5 fw-bold mb-0">Send me an email</h2>
                  <p className="text-secondary small mb-0">
                    Opens Gmail with your message ready to send.
                  </p>
                </div>
              </div>

              <div className="dz-field">
                <label className="dz-field__label" htmlFor={subjectId}>
                  Subject
                </label>
                <select
                  id={subjectId}
                  className="form-select contact-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={`dz-field ${messageError ? "dz-field--error" : ""}`}
              >
                <label className="dz-field__label" htmlFor={messageId}>
                  Message
                  <span className="dz-field__star" aria-hidden="true">
                    {" "}
                    *
                  </span>
                </label>
                <div className="dz-field__control">
                  <textarea
                    id={messageId}
                    className="dz-field__input contact-textarea"
                    placeholder="Write your message here…"
                    maxLength={MAX_LENGTH}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onBlur={() => setTouched(true)}
                    required
                    aria-invalid={messageError ? true : undefined}
                    aria-describedby={messageHelpId}
                  />
                </div>
                <div className="d-flex gap-3" id={messageHelpId}>
                  {messageError ? (
                    <p
                      className="dz-field__message dz-field__message--error"
                      aria-live="polite"
                    >
                      {messageError}
                    </p>
                  ) : (
                    <p className="dz-field__message">
                      At least {MIN_LENGTH} characters
                    </p>
                  )}
                  <span className="contact-counter">
                    {message.length}/{MAX_LENGTH}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                featured
                size="lg"
                fullWidth
                icon={<Icon name="send" size={18} />}
              >
                Send with Gmail
              </Button>

              <p className="small text-secondary text-center mb-0">
                Not using Gmail?{" "}
                <a
                  className="contact-link"
                  href={mailtoLink(CONTACT.email, emailSubject, trimmed)}
                >
                  Open your mail app
                </a>
              </p>
            </form>
          </div>

          {/* ---------- Option 2: WhatsApp ---------- */}
          <div className="col-lg-5">
            <section className="contact-card h-100 d-flex flex-column gap-4">
              <div className="d-flex align-items-center gap-3">
                <span className="contact-card__icon">
                  <Icon name="whatsapp" size={24} />
                </span>
                <div>
                  <h2 className="h5 fw-bold mb-0">Chat on WhatsApp</h2>
                  <p className="text-secondary small mb-0">
                    Prefer a quick chat? Message me directly.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-secondary small mb-1">My number</p>
                <p className="contact-number mb-0">
                  {CONTACT.whatsapp.display}
                </p>
              </div>

              <p className="text-secondary mb-0">
                {trimmed
                  ? "The message you wrote on the left will be filled in for you."
                  : "A short greeting will be filled in for you, you can change it before sending."}
              </p>

              <div className="mt-auto">
                <a
                  className="btn btn-accent btn-lg rounded-pill w-100 d-inline-flex align-items-center justify-content-center gap-2"
                  href={whatsappLink(trimmed || DEFAULT_WHATSAPP_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="whatsapp" size={20} />
                  Open WhatsApp
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </div>
            </section>
          </div>
        </div>

        {/* Other places to find the developer */}
        <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 mt-5">
          <span className="text-secondary">Or find me here:</span>
          <a
            className="btn btn-outline-primary rounded-pill d-inline-flex align-items-center gap-2"
            href={CONTACT.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="github" /> GitHub
          </a>
          <a
            className="btn btn-outline-primary rounded-pill d-inline-flex align-items-center gap-2"
            href={CONTACT.linkedin}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="linkedin" /> LinkedIn
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default Contact;
