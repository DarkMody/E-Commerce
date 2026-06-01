import Button from "../../components/button/button";
import Input from "../../components/input/input";
import Footer from "../../components/footer/footer";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./register.css";

function Register() {
  const [validEmail, setEmail] = useState(false);
  const [validPassword, setPassword] = useState(false);
  const [validUser, setUser] = useState(false);

  useEffect(() => {
    const userName = document.querySelector("#username");
    const email = document.querySelector("#email");
    const password = document.querySelector("#password");
    let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    userName.addEventListener("input", () => {
      if (userName.value.length >= 3) setUser(true);
      else setUser(false);
    });
    email.addEventListener("input", () => {
      if (regex.test(email.value)) setEmail(true);
      else setEmail(false);
    });
    password.addEventListener("input", () => {
      if (password.value.length < 5) setPassword(false);
      else setPassword(true);
    });
  });

  const registerClick = () => {
    const password = document.querySelector("#password").value;
    const confirm = document.querySelector("#confirm").value;

    if (validEmail && validPassword && confirm == password && validUser) {
      // Fetch data
    } else if (!validUser) {
      window.toast("invalid", "Username must be 3 letters at least");
    } else if (!validEmail) {
      window.toast(
        "invalid",
        "Email's format must be like this => example@gmail.com",
      );
    } else if (!password) {
      window.toast("invalid", "Password must be 5 letters at least");
    } else {
      window.toast("invalid", "Confirm password dosen't equal password");
    }
  };

  return (
    <div className="row main-register">
      <div className="col-md-6 col-lg-6 col-12 p-0">
        <div className="intro d-flex justify-content-center align-items-center flex-column gap-2 p-5 text-center">
          <Link className="rounded-pill fw-bold go-to-home" to="/">
            &lt;- Home
          </Link>
          <h1 className="fw-bold fs-1">Welcome To DarkZon</h1>
          <p className="text-white-50">
            The best place to find whatever you want with the best prices go and
            have your journey
          </p>
        </div>
      </div>
      <div className="col-md-6 col-lg-6 col-12 p-0 d-flex align-items-center">
        <div
          className="m-auto py-5 px-3 d-flex flex-column align-items-center gap-3"
          id="register"
        >
          <h1 className="fw-bold">Register</h1>
          <Input placeholder="Username" type="text" id="username"></Input>
          <Input placeholder="Email" type="Email" id="email"></Input>
          <Input placeholder="Password" type="Password" id="password"></Input>
          <Input
            placeholder="Confirm Password"
            type="Password"
            id="confirm"
          ></Input>
          <Button
            text="Register"
            id="register-btn"
            onclick={registerClick}
          ></Button>
          <div>
            Already have account ?{" "}
            <Link className="fw-bold" to="/login">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
