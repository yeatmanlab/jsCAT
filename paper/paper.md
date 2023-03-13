---
title: 'jsCAT: Computer Adaptive Testing in JavaScript'
tags:
# TODO (Anya): Add tags
    - 
authors:
    - name: Wanjing Anya Ma^[corresponding author]
      orcid: 0000-0001-5761-8707
      affiliation: 1
    - name: Jason D. Yeatman
      orcid: 0000-0002-2686-1293
      affiliation: "1, 2"
    - name: Adam Richie-Halford
      orcid: 0000-0001-9276-9084
      affiliation: "1, 2"
affiliations:
  - name: # TODO (Anya) Add GSE affiliation
    index: 1
  - name: # TODO (Anya) Add DBP affiliation
    index: 2
date: 13 March 2023
bibliography: paper.bib
---

<!-- TODO: Remove this before submission -->

- [ ] A list of the authors of the software and their affiliations, using the correct format (see the example below).
- [ ] A summary describing the high-level functionality and purpose of the software for a diverse, non-specialist audience.
- [ ] A Statement of need section that clearly illustrates the research purpose of the software and places it in the context of related work.
- [ ] A list of key references, including to other software addressing related needs. Note that the references should include full names of venues, e.g., journals and conferences, not abbreviations only understood in the context of a specific discipline.
- [ ] Mention (if applicable) a representative set of past or ongoing research projects using the software and recent scholarly publications enabled by it.
- [ ] Acknowledgement of any financial support.

# Summary

jsCAT is a JavaScript library to support a fully client-side adaptive testing
environment. Computerized Adaptive Testing (CAT) is a type of assessment that
uses computer algorithms to dynamically adjust the difficulty of questions based
on a test-taker's performance. Although CAT has been widely researched and
applied in areas such as education and psychology (e.g., GRE and Duolingo),
designing a CAT solution suitable for large-scale school administration remains
a challenge. Imagine we are administering 500 children in a school at the same
time, where reliable wifi is not guaranteed at all times, which means that we
should minimize data communications between the client and servers to prevent
disruptions. Most existing adaptive testing solutions, written in R or Python,
do not support this requirement. jsCAT is designed to overcome this challenge by
implementing the item response theory (reference) and CAT in JavaScript. The
simulation results demonstrate that jsCAT is highly comparable to the popular
R-based adaptive testing algorithm package, catR (Magis & Raîche, 2011).

# Statement of Need

This tool can be widely used in education and behavioral sciences research to
design browser-based adaptive measurements.

# Code availability

The source code is publicly accessible in a GitHub repository ([https://github.com/neuroneural/brainchop](https://github.com/neuroneural/brainchop)) with detailed step-by-step [documentation](https://github.com/neuroneural/brainchop/wiki). Built-in models also are provided with brainchop  [live demo](https://neuroneural.github.io/brainchop/).  

# Author contributions

<!-- TODO (Anya, Adam, and Jason): Review this contributions statement -->
We describe contributions to this paper using the CRediT taxonomy [@credit].
Writing – Original Draft: WM;
Writing – Review & Editing: WM, ARH, JY;
Conceptualization and methodology: WM, ARH;
Software and data curation: WM, ARH;
Validation: WM, ARH;
Resources: JY;
Visualization: WM;
Supervision: JY;
Project Administration: WM;
Funding Acquisition: JY.

# Acknowledgments

<!-- TODO (Anya) Insert funding acknowlegments. And also any individuals we'd like to thank for their help if they don't qualify as authors. -->

# References

<!-- TODO (Anya): Add references in the paper.bib file -->