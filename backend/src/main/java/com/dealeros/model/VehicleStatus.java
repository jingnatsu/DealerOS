package com.dealeros.model;

public enum VehicleStatus {
    STOCK,       // In stock, available
    RESERVED,    // Deposit taken / pending sale
    SOLD,        // Sold — moved to sold history
    SOR,         // Sale or Return
    WRITTEN_OFF  // Written off / scrapped
}
