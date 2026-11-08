- Eshkol (Tsotchke, MIT; credited) is used as the exact-gradient engine for the isolated temporal core. BPTT: Werbos 1990, Proc IEEE 78:1550. Adam: Kingma & Ba 2015. Model-based rollout: Sutton 1990 (Dyna). Second-order error prediction for confidence: Fleming & Daw 2017, Psychol Rev 124:91.

- v5.4 cortical forward model / error-model precision: predictive coding (Rao & Ballard 1999, Nat Neurosci 2:79); precision-weighting of action (Friston et al. 2012, Front Psychol 3:130; Feldman & Friston 2010); self-error prediction as metacognition (Fleming & Daw 2017, Psychol Rev 124:91). Training engine: Eshkol (Tsotchke) verified BPTT port; design by Alex Donahue.

- v5.5 DMUL: Larkum, Zhu & Sakmann 1999 Nature 398:338; Larkum 2013 TINS 36:141 (apical-basal coincidence). AOM: Kalman yield tracking with information gain (Lindley 1956; Schmidhuber 1991 curiosity; Friston et al. 2015 epistemic value); restless-bandit exploration (Daw et al. 2006 Nature 441:876). Design: Alex Donahue; engine lineage: Eshkol/QGTL (Tsotchke).

- v5.6 L5 pool: Larkum 2013 TINS 36:141; Oja 1982 J Math Biol 15:267 (Hebbian PCA). Depletion-aware value: marginal value theorem (Charnov 1976 Theor Pop Biol 9:129); model-based choice (Daw, Niv & Dayan 2005). Design: Alex Donahue; Eshkol/QGTL lineage (Tsotchke).

- v5.7: phasic LC-NE gating of plasticity (Sara 2009 Nat Rev Neurosci 10:211; Yu & Dayan 2005 Neuron 46:681); Oja 1982; divisive normalisation (Carandini & Heeger 2012 Nat Rev Neurosci 13:51); L5 apical-basal coincidence (Larkum 2013). Design: Alex Donahue; Eshkol/QGTL lineage (Tsotchke).

- B24 L5 feedback: top-down apical-to-soma coupling motif (Larkum 2013, Trends Neurosci 36:141). Built for Alex Donahue; Tsotchke Eshkol/QGTL credited as before.

- B25 divisive normalisation of cortical drive (Carandini & Heeger 2012, Nat Rev Neurosci 13:51); tested, not adopted. Credit: Alex Donahue; Tsotchke Eshkol/QGTL.

- B26 two-compartment cortical cells (Larkum 2013; Poirazi, Brannon & Mel 2003, Neuron 37:989); tested, not adopted. Credit: Alex Donahue; Tsotchke Eshkol/QGTL.
