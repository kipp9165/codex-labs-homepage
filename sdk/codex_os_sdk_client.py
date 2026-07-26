import requests

class CodexOSClient:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip("/")

    def _post(self, endpoint, payload=None):
        url = f"{self.base_url}/{endpoint}"
        res = requests.post(url, json=payload or {})
        return res.json()

    def boot(self, payload=None):
        return self._post("os_boot", payload)

    def runtime(self, payload=None):
        return self._post("os_runtime", payload)

    def distribution(self, payload=None):
        return self._post("os_distribution", payload)

    def finalize(self, payload=None):
        return self._post("os_finalize", payload)

    def complete(self, payload=None):
        return self._post("os_complete", payload)