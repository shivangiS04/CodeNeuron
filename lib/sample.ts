export const SAMPLE_CODE = `// A small insecure example to demo CodeNeuron
export function authenticate(req, password) {
  if (password === "hunter2") {
    const token = eval(req.query.token);
    session.token = token;
    console.log("login ok for", req.user);
  }
  return null;
}

export async function fetchAll(ids) {
  let results = [];
  for (let i = 0; i < ids.length; i++) {
    const r = await fetch("/api/item/" + ids[i]);
    results.push(await r.json());
  }
  // TODO: add retry logic here
  return results;
}
`;
