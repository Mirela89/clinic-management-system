package com.medicareplus.medical.medication;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MedicationResponse {

    private Long id;
    private String name;
    private String activeSubstance;
    private String dosage;
    private String manufacturer;
}
