import api from "../../../axios.ts";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../pages/login/context/authContext.tsx";
import toast from "react-hot-toast";
import InputField from "../../../shared/components/UI/InputField";

const FORM_FIELDS = [
  {
    label: "Full Name",
    name: "fullName",
    placeholder: "Your full name",
    type: "text",
  },
  { label: "Email", name: "email", placeholder: "Your email", type: "email" },
  {
    label: "Password",
    name: "password",
    placeholder: "Your password",
    type: "password",
  },
  {
    label: "Confirm Password",
    name: "confirmPassword",
    placeholder: "Confirm Password",
    type: "password",
  },
];

const Profile = () => {
  const ctxt = useContext(AuthContext);
  if (!ctxt) throw new Error("AuthProvider missing");
  const { setAuthLogin, setEmail, email } = ctxt;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    api
      .get("/api/user/get_user", { withCredentials: true })
      .then((res) => {
        const user = res.data;
        if (!user) return;
        setForm((prev) => ({
          ...prev,
          fullName: user.fullName ?? "",
          email: user.email ?? "",
        }));
      })
      .catch((err) => {
        // A removed account is handled by the axios interceptor, which sends
        // the browser to the login page, so there is nothing to report here.
        if (err?.response?.data?.code === "SESSION_INVALID") return;
        toast.error("Failed to load profile");
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
    if (!form.fullName) {
      newErrors.fullName = "Full name is required";
    }
    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (form.password) {
      if (form.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
      if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setErrors({});
    if (!validate()) return;

    await api
      .put(
        "/api/user/change",
        {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
        },
        { withCredentials: true },
      )
      .then(() => {
        setIsEditing(false); // Fixed from setIsEditing(true) which seemed like a bug in original code
        toast.success("Profile updated");
      })
      .catch((error) => {
        if (error?.response && error.response.data?.errors) {
          setErrors(error.response.data.errors);
        } else {
          toast.error(
            error?.response?.data?.message ?? "Failed to update profile",
          );
        }
      });
  };

  const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await api
      .post("/api/user/logout", {}, { withCredentials: true })
      .then(() => {
        setAuthLogin(false);
        setEmail("");
        navigate("/login");
      })
      .catch((err) => console.error("Logout error:", err));
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="Profile flex flex-col mt-[120px] mx-auto max-w-[900px] px-[var(--mobile-x-padding)] laptop:px-[var(--desktop-x-padding)] tablet:px-[var(--laptop-x-padding)] pb-[80px]">
      <div className="mb-[32px]">
        <h1 className="font-semibold text-2xl mobile:text-3xl tracking-tight">
          Welcome back, there
        </h1>
        <p className="text-sm text-gray-400 mt-[6px] tracking-wide">{today}</p>
      </div>

      <div className="border border-gray-200 rounded-[4px] overflow-hidden">
        <div className="h-[56px] bg-gradient-to-r from-amber-50 to-stone-200" />
        <div className="py-[60px] px-[20px] mobile:px-[32px]">
          <div className="flex flex-wrap justify-between items-start gap-[20px] mb-[36px]">
            <div className="flex flex-row flex-wrap gap-[20px] items-center">
              <div className="flex flex-col gap-[4px]">
                <h2 className="font-semibold text-[18px] mobile:text-[20px] tracking-tight">
                  {form.fullName ? form.fullName : "-"}
                </h2>
                <p className="text-gray-400 text-sm">{email}</p>
              </div>
            </div>

            <div className="flex flex-row items-center gap-[10px]">
              <Link
                to="/admin"
                className="text-sm font-medium border bg-blue-400 px-[14px] py-[7px] hover:bg-blue-600 hover:border-stone-400 transition-all duration-200 rounded-lg"
              >
                Admin
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium border border-stone-500 px-[14px] py-[7px] hover:bg-stone-100 hover:border-stone-400 transition-all duration-200 rounded-lg"
              >
                Log out
              </button>
              <button
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                className="text-sm font-medium bg-white border border-stone-300 text-stone-700 px-[14px] py-[7px] rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                {isEditing ? "Save" : "Edit Profile"}
              </button>
            </div>
          </div>
          <div className="border-t border-gray-100 mb-[32px]" />

          <h3 className="text-[11px] font-medium tracking-[0.15em] text-gray-400 uppercase mb-[20px]">
            Personal details
          </h3>
          <form
            className="grid grid-cols-1 tablet:grid-cols-2 gap-[20px] mobile:gap-[24px]"
            onSubmit={(e) => e.preventDefault()}
          >
            {FORM_FIELDS.map(({ label, name, placeholder, type }) => (
              <div key={name} className="flex flex-col gap-[8px]">
                <InputField
                  id={name}
                  name={name}
                  label={label}
                  placeholder={placeholder}
                  type={type}
                  value={form[name as keyof typeof form]}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  error={errors[name]}
                  labelClassName="text-[11px] font-medium tracking-[0.1em] text-gray-500 uppercase"
                />
              </div>
            ))}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
