export function governanceRules(input) {
  return {
    governed: true,
    input,
    message: "Governance rules applied deterministically"
  };
}
