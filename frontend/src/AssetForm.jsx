import { useEffect, useState } from "react";
import "./AssetForm.css";

const initialState = {
  assetName: "",
  description: "",
  assetType: "",
  owner: "",
  department: "",
  location: "",
  manufacturer: "",
  model: "",
  assetTag: "",
  serialNumber: "",
  deviceType: "",
};

const initialErrors = {
  assetName: "",
  assetType: "",
  owner: "",
  department: "",
  location: "",
  manufacturer: "",
  model: "",
  assetTag: "",
  serialNumber: "",
  deviceType: "",
};

function AssetForm({ asset, onSave, onCancel }) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState(initialErrors);
  const [touched, setTouched] = useState({});

  /* =====================================================
      LOAD EDIT DATA
  ===================================================== */

  useEffect(() => {
    if (asset) {
      setForm({
        assetName: asset.assetName || "",
        description: asset.description || "",
        assetType: asset.assetType || "",
        owner: asset.owner || "",
        department: asset.department || "",
        location: asset.location || "",
        manufacturer: asset.manufacturer || "",
        model: asset.model || "",
        assetTag: asset.assetTag || "",
        serialNumber: asset.serialNumber || "",
        deviceType: asset.deviceType || "",
      });
    } else {
      setForm(initialState);
    }

    setErrors(initialErrors);
    setTouched({});
  }, [asset]);

  /* =====================================================
      VALIDATE SINGLE FIELD
  ===================================================== */

  const validateField = (name, value) => {
    const trimmedValue = value.trim();

    switch (name) {
      case "assetName":
        if (!trimmedValue) {
          return "Asset name is required";
        }

        if (trimmedValue.length < 3) {
          return "Asset name must be at least 3 characters";
        }

        if (trimmedValue.length > 100) {
          return "Asset name must not exceed 100 characters";
        }

        return "";

      case "assetType":
        if (!trimmedValue) {
          return "Asset type is required";
        }

        return "";

      case "owner":
        if (!trimmedValue) {
          return "Owner is required";
        }

        if (trimmedValue.length < 2) {
          return "Owner must be at least 2 characters";
        }

        return "";

      case "department":
        if (!trimmedValue) {
          return "Department is required";
        }

        return "";

      case "location":
        if (trimmedValue.length > 100) {
          return "Location must not exceed 100 characters";
        }

        return "";

      case "manufacturer":
        if (trimmedValue.length > 100) {
          return "Manufacturer must not exceed 100 characters";
        }

        return "";

      case "model":
        if (trimmedValue.length > 100) {
          return "Model must not exceed 100 characters";
        }

        return "";

      case "assetTag":
        if (trimmedValue.length > 50) {
          return "Asset tag must not exceed 50 characters";
        }

        return "";

      case "serialNumber":
        if (trimmedValue.length > 100) {
          return "Serial number must not exceed 100 characters";
        }

        return "";

      case "deviceType":
        if (trimmedValue.length > 50) {
          return "Device type must not exceed 50 characters";
        }

        return "";

      default:
        return "";
    }
  };

  /* =====================================================
      VALIDATE ALL
  ===================================================== */

  const validateForm = () => {
    const newErrors = {};

    Object.keys(form).forEach((field) => {
      newErrors[field] = validateField(
        field,
        form[field]
      );
    });

    setErrors(newErrors);

    const requiredFields = [
      "assetName",
      "assetType",
      "owner",
      "department",
    ];

    const hasRequiredError = requiredFields.some(
      (field) => newErrors[field]
    );

    if (hasRequiredError) {
      return false;
    }

    return !Object.values(newErrors).some(Boolean);
  };

  /* =====================================================
      HANDLE CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  /* =====================================================
      HANDLE BLUR
  ===================================================== */

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  /* =====================================================
      SUBMIT
  ===================================================== */

  const handleSubmit = (e) => {
    e.preventDefault();

    const valid = validateForm();

    setTouched({
      assetName: true,
      assetType: true,
      owner: true,
      department: true,
      location: true,
      manufacturer: true,
      model: true,
      assetTag: true,
      serialNumber: true,
      deviceType: true,
    });

    if (!valid) {
      return;
    }

    const cleanedForm = {
      ...form,
      assetName: form.assetName.trim(),
      description: form.description.trim(),
      assetType: form.assetType.trim(),
      owner: form.owner.trim(),
      department: form.department.trim(),
      location: form.location.trim(),
      manufacturer: form.manufacturer.trim(),
      model: form.model.trim(),
      assetTag: form.assetTag.trim(),
      serialNumber: form.serialNumber.trim(),
      deviceType: form.deviceType.trim(),
    };

    onSave(cleanedForm);
  };

  /* =====================================================
      FIELD CLASS
  ===================================================== */

  const getFieldClass = (name) => {
    if (!touched[name]) {
      return "";
    }

    if (errors[name]) {
      return "input-invalid";
    }

    if (form[name]?.trim()) {
      return "input-valid";
    }

    return "";
  };

  return (
    <div className="asset-form-container">

      <div className="asset-form-header">
        <h2>
          {asset ? "Update Asset" : "Add New Asset"}
        </h2>

        <button
          type="button"
          className="form-close-btn"
          onClick={onCancel}
        >
          ×
        </button>
      </div>

      <form
        className="asset-form"
        onSubmit={handleSubmit}
        noValidate
      >

        {/* =================================================
            ASSET NAME
        ================================================= */}

        <div className="form-group">

          <label>
            Asset Name <span>*</span>
          </label>

          <input
            type="text"
            name="assetName"
            placeholder="Enter asset name"
            value={form.assetName}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldClass("assetName")}
          />

          {touched.assetName && errors.assetName && (
            <small className="validation-error">
              {errors.assetName}
            </small>
          )}

        </div>

        {/* =================================================
            DESCRIPTION
        ================================================= */}

        <div className="form-group full-width">

          <label>
            Description
          </label>

          <textarea
            name="description"
            rows="3"
            placeholder="Enter asset description"
            value={form.description}
            onChange={handleChange}
          />

        </div>

        {/* =================================================
            ASSET TYPE
        ================================================= */}

        <div className="form-group">

          <label>
            Asset Type <span>*</span>
          </label>

          <select
            name="assetType"
            value={form.assetType}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldClass("assetType")}
          >

            <option value="">
              Select Asset Type
            </option>

            <option value="Desktop">
              Desktop
            </option>

            <option value="Laptop">
              Laptop
            </option>

            <option value="Server">
              Server
            </option>

            <option value="Switch">
              Switch
            </option>

            <option value="Router">
              Router
            </option>

            <option value="Firewall">
              Firewall
            </option>

            <option value="Printer">
              Printer
            </option>

            <option value="Mobile">
              Mobile
            </option>

            <option value="Virtual Machine">
              Virtual Machine
            </option>

          </select>

          {touched.assetType && errors.assetType && (
            <small className="validation-error">
              {errors.assetType}
            </small>
          )}

        </div>

        {/* =================================================
            OWNER
        ================================================= */}

        <div className="form-group">

          <label>
            Owner <span>*</span>
          </label>

          <input
            type="text"
            name="owner"
            placeholder="Enter owner name"
            value={form.owner}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldClass("owner")}
          />

          {touched.owner && errors.owner && (
            <small className="validation-error">
              {errors.owner}
            </small>
          )}

        </div>

        {/* =================================================
            DEPARTMENT
        ================================================= */}

        <div className="form-group">

          <label>
            Department <span>*</span>
          </label>

          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldClass("department")}
          >

            <option value="">
              Select Department
            </option>

            <option value="IT">
              IT
            </option>

            <option value="SOC">
              SOC
            </option>

            <option value="HR">
              HR
            </option>

            <option value="Finance">
              Finance
            </option>

            <option value="Admin">
              Admin
            </option>

            <option value="Development">
              Development
            </option>

            <option value="Networking">
              Networking
            </option>

            <option value="Support">
              Support
            </option>

          </select>

          {touched.department && errors.department && (
            <small className="validation-error">
              {errors.department}
            </small>
          )}

        </div>

        {/* =================================================
            LOCATION
        ================================================= */}

        <div className="form-group">

          <label>
            Location
          </label>

          <input
            type="text"
            name="location"
            placeholder="Enter location"
            value={form.location}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldClass("location")}
          />

          {touched.location && errors.location && (
            <small className="validation-error">
              {errors.location}
            </small>
          )}

        </div>

        {/* =================================================
            Vendor
        ================================================= */}

        <div className="form-group">

          <label>
            Vendor
          </label>

          <input
            type="text"
            name="manufacturer"
            placeholder="Enter Vendor Name"
            value={form.manufacturer}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldClass("manufacturer")}
          />

          {touched.manufacturer &&
            errors.manufacturer && (
              <small className="validation-error">
                {errors.manufacturer}
              </small>
            )}

        </div>

        {/* =================================================
            MODEL
        ================================================= */}

        <div className="form-group">

          <label>
            Model
          </label>

          <input
            type="text"
            name="model"
            placeholder="Enter model"
            value={form.model}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldClass("model")}
          />

          {touched.model && errors.model && (
            <small className="validation-error">
              {errors.model}
            </small>
          )}

        </div>

        {/* =================================================
            DEVICE TYPE
        ================================================= */}

        <div className="form-group">

          <label>
            Device Type
          </label>

          <input
            type="text"
            name="deviceType"
            placeholder="Enter device type"
            value={form.deviceType}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldClass("deviceType")}
          />

          {touched.deviceType &&
            errors.deviceType && (
              <small className="validation-error">
                {errors.deviceType}
              </small>
            )}

        </div>

        {/* =================================================
            ASSET TAG
        ================================================= */}

        <div className="form-group">

          <label>
            Asset Tag
          </label>

          <input
            type="text"
            name="assetTag"
            placeholder="Enter asset tag"
            value={form.assetTag}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldClass("assetTag")}
          />

          {touched.assetTag &&
            errors.assetTag && (
              <small className="validation-error">
                {errors.assetTag}
              </small>
            )}

        </div>

        {/* =================================================
            SERIAL NUMBER
        ================================================= */}

        <div className="form-group">

          <label>
            Serial Number
          </label>

          <input
            type="text"
            name="serialNumber"
            placeholder="Enter serial number"
            value={form.serialNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldClass("serialNumber")}
          />

          {touched.serialNumber &&
            errors.serialNumber && (
              <small className="validation-error">
                {errors.serialNumber}
              </small>
            )}

        </div>

        {/* =================================================
            BUTTONS
        ================================================= */}

        <div className="form-buttons">

          {/* <button
            type="button"
            className="cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button> */}

          <button
            type="submit"
            className="save-btn"
          >
            {asset
              ? "Update Asset"
              : "Create Asset"}
          </button>

        </div>

      </form>

    </div>
  );
}

export default AssetForm;