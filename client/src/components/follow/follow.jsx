import Button from "../button/button";
import "./follow.css";
import Input from "../input/input";

function Follow() {
  return (
    <div className="follow p-5">
      <div className="row d-flex justify-content-center align-items-center">
        <div className="col-lg-6 col-12 mb-3 mb-lg-0">
          <h1 className="text-uppercase text-center">
            Stay Up To Date About Our latest offers
          </h1>
        </div>
        <div className="col-lg-4 col-12 text-center mb-3 mb-lg-0">
          <Input type="email" placeholder="example@gmail.com"></Input>
        </div>
        <div className="col-lg-2 col-12 text-center">
          <Button text="Subscribe" id="sub"></Button>
        </div>
      </div>
    </div>
  );
}
export default Follow;
