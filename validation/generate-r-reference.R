#!/usr/bin/env Rscript

# Generate the independent reference estimates for the golden fixture tests.
#
# Reads the item bank and simulated responses produced by
# scripts/generate-golden-fixtures.js and scores every examinee with the catR
# package (Magis et al.), writing the reference thetas to
# src/__tests__/__fixtures__/golden/expected-r-reference.csv.
#
# Once that file is committed, src/__tests__/golden.test.ts automatically
# compares jsCAT's MLE and EAP estimates against it within tolerance on every
# test run — no R required at test time.
#
# Usage (from the repo root):
#   Rscript validation/generate-r-reference.R
#
# Requirements: R >= 4.0, catR (install.packages("catR"))

library(catR)

fixture_dir <- file.path("src", "__tests__", "__fixtures__", "golden")

items <- read.csv(file.path(fixture_dir, "items.csv"))
responses <- read.csv(file.path(fixture_dir, "responses.csv"))

# catR expects an item parameter matrix with columns a, b, c, d
it <- as.matrix(items[, c("a", "b", "c", "d")])
resp_matrix <- as.matrix(responses[, grepl("^i", names(responses))])

# Match jsCAT's settings: theta bounds [-6, 6]; EAP with a standard normal
# prior. jsCAT quantizes the EAP prior on a 0.1-step grid over [-6, 6]
# (121 points), so we use 121 quadrature points here as well.
theta_mle <- apply(resp_matrix, 1, function(x) {
  thetaEst(it, x, method = "ML", range = c(-6, 6))
})

theta_eap <- apply(resp_matrix, 1, function(x) {
  thetaEst(
    it, x,
    method = "EAP",
    priorDist = "norm",
    priorPar = c(0, 1),
    lower = -6,
    upper = 6,
    nqp = 121
  )
})

out <- data.frame(pid = responses$pid, theta_mle = theta_mle, theta_eap = theta_eap)
write.csv(out, file.path(fixture_dir, "expected-r-reference.csv"), row.names = FALSE)

cat(sprintf(
  "Wrote catR reference estimates for %d examinees to %s\n",
  nrow(out),
  file.path(fixture_dir, "expected-r-reference.csv")
))
