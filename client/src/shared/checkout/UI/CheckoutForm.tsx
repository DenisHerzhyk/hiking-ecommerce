import {
  useElements,
  useStripe,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { FormEvent, useEffect } from "react";
import { useCheckout } from "../context/CheckoutContext";

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { setCurrentStep } = useCheckout();

  useEffect(() => {
    setCurrentStep(1);
  }, []);
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `http://localhost:5173/order`,
      },
    });
  };

  return (
    <div className="DeliveryInfo flex flex-col items-center min-h-screen px-[var(--mobile-x-padding)] laptop:px-[var(--desktop-x-padding)] tablet:px-[var(--laptop-x-padding)] mt-[63px] mobile:mt-[80px] pb-[80px]">
      <div className="flex flex-col laptop:flex-row gap-[40px] laptop:gap-[80px] max-w-[1100px]">
        <div className="flex-1">
          <h1 className="font-semibold text-center text-xl mobile:text-2xl tracking-tight mb-[20px]">
            Card Information
          </h1>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 max-w-[600px] mx-auto"
          >
            <div className="flex flex-col gap-4 p-4 border border-gray-300 rounded-lg shadow-sm">
              <PaymentElement />
              <button className="w-full bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-black text-lg font-medium py-4 px-4 rounded-md transition-colors">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
