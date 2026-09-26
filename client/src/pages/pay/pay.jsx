import AddressPicker from "../../components/addressPicker/addressPicker";
import { useState } from "react";

function CheckoutAddress() {
  const [address, setAddress] = useState(null);

  return (
    <div>
      <AddressPicker onSelect={setAddress} />
      {address && (
        <p>
          Selected: {address.lat}, {address.lng} — {address.formattedAddress}
        </p>
      )}
      {/* <button onClick={() => saveAddressToOrder(address)}>
        Confirm Address
      </button> */}
    </div>
  );
}

export default CheckoutAddress;
