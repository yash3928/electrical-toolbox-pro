# electrical-toolbox-pro
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Electrical Toolbox Pro</title>
    <link rel="stylesheet" href="style.css">
</head>

<body>

<div class="container">

    <h1>⚡ Electrical Toolbox Pro</h1>
    <p class="subtitle">전기기사 실무 Toolbox</p>

    <div class="card">

        <h2>3상 전류 계산기</h2>

        <label>전력(kW)</label>
        <input type="number" id="kw" placeholder="예: 22">

        <label>전압(V)</label>
        <input type="number" id="volt" value="380">

        <label>역률</label>
        <input type="number" id="pf" value="0.9" step="0.01">

        <button onclick="calculateCurrent()">계산하기</button>

        <button class="reset" onclick="resetForm()">초기화</button>

        <div class="result">

            <h3>계산 결과</h3>

            <p>전류 :
                <span id="current">-</span> A
            </p>

        </div>

    </div>

</div>

<script src="script.js"></script>

</body>
</html>
