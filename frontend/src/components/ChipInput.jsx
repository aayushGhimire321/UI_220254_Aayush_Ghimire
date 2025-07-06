import React, { useState } from "react";

const ChipInput = ({ chips = [], onChange, placeholder = "Add a chip..." }) => {
    const [input, setInput] = useState("");
    const [chipList, setChipList] = useState(chips);

    const handleInputChange = (e) => setInput(e.target.value);

    const handleInputKeyDown = (e) => {
        if ((e.key === "Enter" || e.key === ",") && input.trim()) {
            e.preventDefault();
            if (!chipList.includes(input.trim())) {
                const newChips = [...chipList, input.trim()];
                setChipList(newChips);
                onChange && onChange(newChips);
            }
            setInput("");
        } else if (e.key === "Backspace" && !input && chipList.length) {
            const newChips = chipList.slice(0, -1);
            setChipList(newChips);
            onChange && onChange(newChips);
        }
    };

    const handleRemoveChip = (chip) => {
        const newChips = chipList.filter((c) => c !== chip);
        setChipList(newChips);
        onChange && onChange(newChips);
    };

    return (
        <div style={{ border: "1px solid #ccc", padding: "6px", borderRadius: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {chipList.map((chip) => (
                <span key={chip} style={{ background: "#e0e0e0", borderRadius: "16px", padding: "4px 8px", display: "flex", alignItems: "center" }}>
                    {chip}
                    <button
                        onClick={() => handleRemoveChip(chip)}
                        style={{ marginLeft: "4px", border: "none", background: "transparent", cursor: "pointer" }}
                        aria-label={`Remove ${chip}`}
                    >
                        &times;
                    </button>
                </span>
            ))}
            <input
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder={placeholder}
                style={{ border: "none", outline: "none", flex: 1, minWidth: "120px" }}
            />
        </div>
    );
};

export default ChipInput;