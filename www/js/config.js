// Enum-like objects for TypeScript enums
const DecodingSpeed = {
    fast: 0,
    normal: 1,
    slow: 2
};

const FormattingType = {
    disabled: 0,
    automatic: 1,
    gs1: 2,
    aamva: 3
};

const MsiChecksumType = {
    disabled: 0,
    mod10: 1,
    mod11: 2,
    mod1010: 3,
    mod1110: 4,
    mod11IBM: 5,
    mod1110IBM: 6
};

const Code39ChecksumType = {
    disabled: 0,
    enabled: 1
};

const Code11ChecksumType = {
    disabled: 0,
    single: 1,
    double: 2
};

const BarkoderResolution = {
    normal: 0,
    high: 1
};

const BarcodeType = {
    aztec: 0,
    aztecCompact: 1,
    qr: 2,
    qrMicro: 3,
    code128: 4,
    code93: 5,
    code39: 6,
    codabar: 7,
    code11: 8,
    msi: 9,
    upcA: 10,
    upcE: 11,
    upcE1: 12,
    ean13: 13,
    ean8: 14,
    pdf417: 15,
    pdf417Micro: 16,
    datamatrix: 17,
    code25: 18,
    interleaved25: 19,
    itf14: 20,
    iata25: 21,
    matrix25: 22,
    datalogic25: 23,
    coop25: 24,
    code32: 25,
    telepen: 26,
    dotcode: 27
};

// BarkoderConfig class
class BarkoderConfig {
    constructor(config) {
        Object.assign(this, config);
    }
}

// DekoderConfig class
class DekoderConfig {
    constructor(config) {
        Object.assign(this, config);
    }
}

// BarcodeConfig class
class BarcodeConfig {
    constructor(config) {
        Object.assign(this, config);
    }
}

// BarcodeConfigWithLength class
class BarcodeConfigWithLength {
    constructor(config) {
        Object.assign(this, config);
    }

    setLengthRange(minLength, maxLength) {
        this.minLength = minLength;
        this.maxLength = maxLength;
    }
}

// MSIBarcodeConfig class
class MSIBarcodeConfig {
    constructor(config) {
        Object.assign(this, config);
    }

    setLengthRange(minLength, maxLength) {
        this.minLength = minLength;
        this.maxLength = maxLength;
    }
}

// Code39BarcodeConfig class
class Code39BarcodeConfig {
    constructor(config) {
        Object.assign(this, config);
    }

    setLengthRange(minLength, maxLength) {
        this.minLength = minLength;
        this.maxLength = maxLength;
    }
}

// Code11BarcodeConfig class
class Code11BarcodeConfig {
    constructor(config) {
        Object.assign(this, config);
    }

    setLengthRange(minLength, maxLength) {
        this.minLength = minLength;
        this.maxLength = maxLength;
    }
}

// DatamatrixBarcodeConfig class
class DatamatrixBarcodeConfig {
    constructor(config) {
        Object.assign(this, config);
    }

    setLengthRange(minLength, maxLength) {
        this.minLength = minLength;
        this.maxLength = maxLength;
    }
}

// GeneralSettings class
class GeneralSettings {
    constructor(config) {
        Object.assign(this, config);
    }

    setROI(x, y, width, height) {
        this.roiX = x;
        this.roiY = y;
        this.roiWidth = width;
        this.roiHeight = height;
    }
}

// Exporting classes and enum-like objects
module.exports = {
    DecodingSpeed,
    FormattingType,
    MsiChecksumType,
    Code39ChecksumType,
    Code11ChecksumType,
    BarkoderResolution,
    BarcodeType,
    BarkoderConfig,
    DekoderConfig,
    BarcodeConfig,
    BarcodeConfigWithLength,
    MSIBarcodeConfig,
    Code39BarcodeConfig,
    Code11BarcodeConfig,
    DatamatrixBarcodeConfig,
    GeneralSettings
};