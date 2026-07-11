param(
  [string]$BaseUrl = "https://codex-labs-homepage.onrender.com",
  [string]$CustomDomain = "",
  [string]$CanonicalHost = ""
)

$ErrorActionPreference = "Stop"

function Test-Route {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [string]$Label = ""
  )

  try {
    $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30
    if ($res.StatusCode -eq 200) {
      Write-Host "OK   $Label $Url" -ForegroundColor Green
      return $res
    }

    Write-Host "FAIL $Label $Url (status $($res.StatusCode))" -ForegroundColor Red
    return $null
  } catch {
    Write-Host "FAIL $Label $Url ($($_.Exception.Message))" -ForegroundColor Red
    return $null
  }
}

function Test-Contains {
  param(
    [Parameter(Mandatory = $true)][string]$Html,
    [Parameter(Mandatory = $true)][string]$Needle,
    [Parameter(Mandatory = $true)][string]$Label
  )

  if ($Html -like "*${Needle}*") {
    Write-Host "OK   $Label" -ForegroundColor Green
  } else {
    Write-Host "FAIL $Label" -ForegroundColor Red
  }
}

$mainPages = @(
  "/index.html",
  "/products.html",
  "/modules.html",
  "/affiliates.html",
  "/pricing.html"
)

$productPages = @(
  "/creator-pack.html",
  "/enterprise-operating-model.html",
  "/enterprise-governance-framework.html",
  "/enterprise-clarity-diagnostic.html",
  "/enterprise-architecture-playbook.html",
  "/base-tier.html",
  "/sovereign-tier.html",
  "/apex-tier.html",
  "/enterprise-retainer.html",
  "/license.html"
)

$expectedCheckoutByPage = @{
  "/creator-pack.html" = "https://pay.codexlitigation.org/b/dRm4gzeF1d6t0WIbg4fbD3V"
  "/enterprise-operating-model.html" = "https://pay.codexlitigation.org/b/4gM4gz2Wj9UhdJu6ZOfbD3W"
  "/enterprise-governance-framework.html" = "https://pay.codexlitigation.org/b/fZudR9cwT5E15cYbg4fbD3X"
  "/enterprise-clarity-diagnostic.html" = "https://pay.codexlitigation.org/b/aFa28reF11nL9tefwkfbD3Y"
  "/enterprise-architecture-playbook.html" = "https://pay.codexlitigation.org/b/3cI5kDcwT9UhgVGgAofbD3Z"
  "/base-tier.html" = "https://pay.codexlitigation.org/b/9B6dR99kHgiF8pa4RGfbD40"
  "/sovereign-tier.html" = "https://pay.codexlitigation.org/b/eVq7sL54r4zX8paesgfbD41"
  "/apex-tier.html" = "https://pay.codexlitigation.org/b/6oU14ncwT4zXgVGbg4fbD42"
  "/enterprise-retainer.html" = "https://pay.codexlitigation.org/b/cNi14n54r6I5axi97WfbD43"
  "/license.html" = "https://pay.codexlitigation.org/b/dRmfZhgN90jH34QdocfbD44"
}

$expectedNav = @'
<nav>
  <ul class="nav-links">
    <li><a href="index.html">Home</a></li>
    <li><a href="products.html">Products</a></li>
    <li><a href="modules.html">Modules</a></li>
    <li><a href="pricing.html">Pricing</a></li>
    <li><a href="affiliates.html">Affiliates</a></li>
  </ul>
</nav>
'@

$expectedFooter = @'
<footer>
  <div class="footer-content">
    <p>Codex Labs OS</p>
    <p>Clarity. Structure. Execution.</p>
    <p><a href="mailto:codexlabsos@gmail.com">codexlabsos@gmail.com</a></p>
  </div>
</footer>
'@

Write-Host "Checking homepage/modules/affiliates/pricing/product page responses..."
$pageResponses = @{}
foreach ($page in ($mainPages + $productPages | Sort-Object -Unique)) {
  $url = "$BaseUrl$page"
  $pageResponses[$page] = Test-Route -Url $url -Label "route"
}

Write-Host "`nChecking navigation and footer consistency on core pages..."
foreach ($page in $mainPages) {
  $res = $pageResponses[$page]
  if ($null -eq $res) { continue }

  $html = [string]$res.Content
  Test-Contains -Html $html -Needle $expectedNav.Trim() -Label "nav snippet present on $page"
  Test-Contains -Html $html -Needle $expectedFooter.Trim() -Label "footer snippet present on $page"
}

Write-Host "`nChecking Stripe checkout links on product pages..."
foreach ($page in $productPages) {
  $res = $pageResponses[$page]
  if ($null -eq $res) { continue }

  $html = [string]$res.Content
  $expected = $expectedCheckoutByPage[$page]
  Test-Contains -Html $html -Needle $expected -Label "checkout link on $page"
}

Write-Host "`nChecking domain and SSL behavior..."
$baseRes = Test-Route -Url "$BaseUrl/index.html" -Label "base-domain"
if ($null -ne $baseRes -and $baseRes.BaseResponse.ResponseUri.Scheme -eq "https") {
  Write-Host "OK   HTTPS active for base domain" -ForegroundColor Green
} elseif ($null -ne $baseRes) {
  Write-Host "FAIL HTTPS not active for base domain" -ForegroundColor Red
}

if (-not [string]::IsNullOrWhiteSpace($CustomDomain)) {
  $domainRes = Test-Route -Url "https://$CustomDomain/index.html" -Label "custom-domain"
  if ($null -ne $domainRes -and $domainRes.BaseResponse.ResponseUri.Scheme -eq "https") {
    Write-Host "OK   SSL active on custom domain" -ForegroundColor Green
  } elseif ($null -ne $domainRes) {
    Write-Host "FAIL SSL inactive on custom domain" -ForegroundColor Red
  }

  if (-not [string]::IsNullOrWhiteSpace($CanonicalHost)) {
    $target = $domainRes.BaseResponse.ResponseUri.Host
    if ($target -eq $CanonicalHost) {
      Write-Host "OK   canonical host redirect ($CanonicalHost)" -ForegroundColor Green
    } else {
      Write-Host "FAIL canonical host redirect expected $CanonicalHost but got $target" -ForegroundColor Red
    }
  }
}

Write-Host "`nChecking Render deployment health signals..."
$renderHealth = Test-Route -Url "$BaseUrl/index.html" -Label "render-health"
if ($null -ne $renderHealth) {
  Write-Host "OK   Render deployment responding" -ForegroundColor Green
} else {
  Write-Host "FAIL Render deployment not responding" -ForegroundColor Red
}

Write-Host "`nVerification complete."
