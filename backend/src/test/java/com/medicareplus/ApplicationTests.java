package com.medicareplus;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test") // trebuie adaugat la fiecare clasa de test
class ApplicationTests {

	@Test
	void contextLoads() {
	}

}
