import { useState, useEffect } from "react";
import "./button.css";

function Button(param) {
  return (
    <button
      id={param.id}
      className={`btn rounded-pill main-btn fw-bold ` + param.className}
      onClick={param.onclick}
    >
      {param.text}
    </button>
  );
}

export default Button;
