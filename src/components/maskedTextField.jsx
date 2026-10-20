import React from "react";
import InputMask from "@mona-health/react-input-mask";
import TextField from "@mui/material/TextField";

export default function MaskedTextField({
  label,
  mask,
  value,
  onChange,
  placeholder,
}) {
  return (
    <InputMask mask={mask} value={value ?? ""} onChange={onChange}>
      {(inputProps) => (
        <TextField
          {...inputProps}
          label={label}
          variant="outlined"
          fullWidth
          placeholder={placeholder}
        />
      )}
    </InputMask>
  );
}
