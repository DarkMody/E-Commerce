import "./input.css";

function Input(params) {
  return (
    <input
      id={params.id}
      className={`rounded-pill px-3 py-2 w-100 ` + params.className}
      type={params.type}
      placeholder={params.placeholder}
    />
  );
}
export default Input;
