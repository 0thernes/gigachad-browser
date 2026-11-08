# Spec

| Component | Operator implementation notes |
| --- | --- |
| IE size class | Patent examples include small MLPs (e.g. 29-10-29, 8-10-8 class cited in CQM header) |
| Critic | Separate net; not merely `argmax` on IE logits |
| Noise schedule | Sweep to find glory / sweet spot |
| Training | Seeded SGD; fixed data order for determinism |

Cosmogonic default CM: `nin=6, nhid=6, nout=4`, trainSteps 900, lr 0.15.
