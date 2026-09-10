import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import CartItemInterface from "../../cart/components/cart_item/interface/CartItemInterface.tsx";
import api from "../../../axios.ts";
import { colorNames } from "../../cart/components/cart_item/components/color.ts";
import { handleCheckoutRequest } from "../../../shared/checkout/handlers/handleCheckout.ts";
import { useCheckout } from "../../../shared/checkout/context/CheckoutContext.tsx";
import InputField from "../../../shared/components/UI/InputField";

const COUNTRIES = [
  "Bulgaria",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Poland",
  "Romania",
  "Ukraine",
  "United Kingdom",
  "United States",
  "Other",
];

interface DeliveryInfoInterface {
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  country: string;
  saveAddress: boolean;
}

const DeliveryInfo = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItemInterface[]>([]);
  const [form, setForm] = useState<DeliveryInfoInterface>({
    firstName: "",
    lastName: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    postalCode: "",
    country: "",
    saveAddress: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { setCurrentStep } = useCheckout();

  const subtotal = Number(
    cartItems
      .reduce((sum, a) => {
        const price = a.product.discount
          ? a.product.price * (1 - a.product.discount / 100) * a.orderQuantity
          : a.product.price * a.orderQuantity;
        return sum + price;
      }, 0)
      .toFixed(2),
  );
  const shipping = subtotal < 99 ? 9 : 0;
  const orderTotal = (subtotal + shipping).toFixed(2);

  useEffect(() => {
    api
      .get("/api/delivery/get_default_address", {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.info) {
          const a = res.data.info;
          setForm((prev) => ({
            ...prev,
            firstName: a.firstName,
            lastName: a.lastName,
            phone: a.phone,
            address1: a.address1,
            address2: a.address2 ?? "",
            city: a.city,
            postalCode: a.postalCode,
            country: a.country,
            saveAddress: a.isDefault,
          }));
        }
      });
  }, []);
  useEffect(() => {
    api
      .get("/api/cart", { withCredentials: true })
      .then((res) => {
        setCartItems(res.data.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);
  useEffect(() => {
    setCurrentStep(0);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.firstName) newErrors.firstName = "First name is required";
    if (!form.lastName) newErrors.lastName = "Last name is required";
    if (!form.phone) newErrors.phone = "Phone number is required";
    if (!form.address1) newErrors.address1 = "Address is required";
    if (!form.city) newErrors.city = "City is required";
    if (!form.postalCode) newErrors.postalCode = "Postal code is required";
    if (!form.country) newErrors.country = "Please select a country";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="DeliveryInfo flex flex-col items-center min-h-screen px-[var(--mobile-x-padding)] laptop:px-[var(--desktop-x-padding)] tablet:px-[var(--laptop-x-padding)] mt-[30px] tablet:mt-[40px] pb-[80px]">
      <div className="flex flex-col laptop:flex-row gap-[40px] laptop:gap-[80px] max-w-[1100px]">
        <div className="flex-1">
          <h1 className="font-semibold text-xl mobile:text-2xl tracking-tight mb-[8px]">
            Delivery Information
          </h1>
          <p className="text-sm text-gray-400 mb-[32px]">
            Enter the address where you'd like your order delivered.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!validate()) return;
              handleCheckoutRequest(
                navigate,
                Number(orderTotal),
                cartItems,
                form,
              );
            }}
            className="flex flex-col gap-[24px]"
          >
            <div className="grid grid-cols-1 mobile:grid-cols-2 gap-[20px]">
              {[
                { label: "First Name", name: "firstName", placeholder: "John" },
                { label: "Last Name", name: "lastName", placeholder: "Doe" },
              ].map(({ label, name, placeholder }) => (
                <div key={name} className="flex flex-col gap-[8px]">
                  <InputField
                    id={name}
                    name={name}
                    label={label}
                    placeholder={placeholder}
                    value={form[name as keyof typeof form] as string}
                    onChange={handleChange}
                    error={errors[name]}
                    labelClassName="text-[11px] font-medium tracking-[0.1em] text-gray-500 uppercase"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-[8px]">
              <InputField
                id="phone"
                name="phone"
                label="Phone"
                placeholder="+1 234 567 8900"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                error={errors.phone}
                labelClassName="text-[11px] font-medium tracking-[0.1em] text-gray-500 uppercase"
              />
            </div>

            <div className="flex flex-col gap-[8px]">
              <InputField
                id="address1"
                name="address1"
                label="Address"
                placeholder="Street name and number"
                value={form.address1}
                onChange={handleChange}
                error={errors.address1}
                labelClassName="text-[11px] font-medium tracking-[0.1em] text-gray-500 uppercase"
              />
            </div>

            <div className="flex flex-col gap-[8px]">
              <InputField
                id="address2"
                name="address2"
                label="Apartment, floor"
                placeholder="Apt 4B, Floor 2..."
                value={form.address2}
                onChange={handleChange}
                error={errors.address2}
                labelClassName="text-[11px] font-medium tracking-[0.1em] text-gray-500 uppercase"
              />
            </div>

            <div className="grid grid-cols-1 mobile:grid-cols-2 gap-[20px]">
              {[
                { label: "City", name: "city", placeholder: "Sofia" },
                {
                  label: "Postal Code",
                  name: "postalCode",
                  placeholder: "1000",
                },
              ].map(({ label, name, placeholder }) => (
                <div key={name} className="flex flex-col gap-[8px]">
                  <InputField
                    id={name}
                    name={name}
                    label={label}
                    placeholder={placeholder}
                    value={form[name as keyof typeof form] as string}
                    onChange={handleChange}
                    error={errors[name]}
                    labelClassName="text-[11px] font-medium tracking-[0.1em] text-gray-500 uppercase"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-[8px]">
              <label className="text-[11px] font-medium tracking-[0.1em] text-gray-500 uppercase">
                Country <span className="text-black">*</span>
              </label>
              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                className={`border-b border-gray-300 focus:border-black bg-transparent text-sm py-[10px] focus:outline-none text-gray-800 transition-colors duration-150 cursor-pointer ${
                  errors.country ? "border-red-500" : ""
                }`}
              >
                <option value="" disabled>
                  Select your country
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.country && (
                <span className="text-red-500 text-[10px] mt-1 font-medium">
                  {errors.country}
                </span>
              )}
            </div>
            <label className="flex items-center gap-[10px] cursor-pointer mt-[4px]">
              <input
                type="checkbox"
                name="saveAddress"
                checked={form.saveAddress}
                onChange={handleChange}
                className="peer hidden"
              />
              <span className="w-[15px] h-[15px] border border-stone-500 rounded-sm flex-shrink-0 peer-checked:bg-stone-600 transition-colors" />
              <span className="text-sm text-gray-600">
                Save this address for future orders
              </span>
            </label>
            <div className="flex flex-row items-center justify-between mt-[12px] pt-[24px] border-t border-gray-100">
              <Link
                to="/cart"
                className="text-sm text-gray-400 hover:text-black transition-colors duration-150 underline underline-offset-4"
              >
                ← Back to cart
              </Link>
              <button
                type="submit"
                className="group flex items-center gap-[8px] bg-white border border-stone-300 text-stone-700 text-sm font-semibold tracking-widest uppercase px-[28px] py-[12px] rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                Continue to Payment
                <IoIosArrowForward className="transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </form>
        </div>
        <div className="hidden laptop:flex flex-col w-[320px] flex-shrink-0">
          <h2 className="text-[11px] font-medium tracking-[0.15em] text-gray-400 uppercase mb-[20px]">
            Order Summary
          </h2>
          <div className="border border-gray-200 p-[20px] flex flex-col gap-[16px]">
            {cartItems.map((item) => (
              <div
                key={item.product.title}
                className="flex flex-row gap-[12px] items-center"
              >
                <img
                  src={item.product.productImages[0]}
                  className="w-[52px] h-[64px] bg-gray-100 flex-shrink-0 object-cover"
                />
                <div className="flex flex-col gap-[4px] flex-1 min-w-0">
                  <p className="text-[12px] font-semibold uppercase truncate">
                    {item.product.title}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Size {item.size} · {colorNames[item.product.color]}
                  </p>

                  <p className="text-[11px] text-gray-400">
                    Qty {item.orderQuantity}
                  </p>
                </div>
                <p className="text-[13px] font-semibold">
                  €
                  {item.product.discount
                    ? (
                        item.product.price *
                        (1 - item.product.discount / 100) *
                        item.orderQuantity
                      ).toFixed(2)
                    : (item.product.price * item.orderQuantity).toFixed(2)}
                </p>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-[16px] flex justify-between items-center">
              <p className="text-[11px] tracking-widest uppercase text-gray-400">
                Total
              </p>
              <p className="text-base font-semibold">€{orderTotal}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryInfo;
