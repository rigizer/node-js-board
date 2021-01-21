// server.js
let express = require('express');                       // 모듈을 불러오는 함수 (매개변수: 모듈 이름 혹은 파일 이름)
let app = express();                                    // express() 리턴 값은 마이크로 웹 서버

let bodyParser = require('body-parser');                // POST 요청 처리 모듈

let mariadb = require('mysql');                         // MySQL 모듈(MariaDB 호환)
let conn = mariadb.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: 'java1004', 
    database: 'board'
});

app.set('view engine', 'pug');                          // 템플릿 엔진 설정
app.set('views', __dirname + '/views');                 // __dirname 시스템 변수: request.getContextPath();
app.use(bodyParser.urlencoded({extended: true}));       // POST 요청을 처리하는 기능(미들웨어)을 확장

// 라우팅(요청 매핑): Java Servlet, @Controller, @GetMapping...
let router = express.Router();                          // 리턴 값: express 라우터

router.get('/addBoard', function(req, res) {
    // 입력 폼으로 리다이렉트
    res.render('addBoard');                             // Java Forward: views/addBoard.pug 뷰 파일 포워드
});

router.post('/addBoard', function(req, res) {
    // 입력 처리하는 기능함수 호출: 데이터베이스 쿼리 호출
    console.log('/addBoard POST 요청');
    
    // Java의 request.getParameter(''); 역할
    let boardPw = req.body.boardPw;
    let boardTitle = req.body.boardTitle;
    let boardContent = req.body.boardContent;
    let boardUser = req.body.boardUser;

    conn.query('INSERT INTO board(board_pw, board_title, board_content, board_user, board_date) VALUES(?, ?, ?, ?, NOW())', 
        [boardPw, boardTitle, boardContent, boardUser], 
        function(err, result) {
            if(err) {   // 쿼리 실패
                console.log('쿼리 실행 실패: ' + err);
                return;
            } else {    // 쿼리 성공
                console.log('쿼리 실행 성공');
                res.redirect('boardList');
                return;
            }
        }
    );
});

router.get('/boardList', function(req, res) {
    let rowPerPage = 10;                                // 페이지 당 10개의 데이터를 표시
    let currentPage = 1;                                // 기본적으로 1 페이지 표시

    if (req.query.currentPage) {
        currentPage = parseInt(req.query.currentPage);
    }

    let beginRow = (currentPage - 1) * rowPerPage;

    let model = {};

    conn.query('SELECT COUNT(*) as cnt FROM board', 
        function(err, result) {
            if(err) {
                console.log('쿼리 실행 실패: ' + err);
                res.end();
            } else {
                console.log('총 개수: ' + result[0].cnt);
                let totalRow = result[0].cnt;
                lastPage = parseInt(totalRow / rowPerPage);

                if (totalRow % rowPerPage != 0) {
                    lastPage++;
                }
            }

            conn.query('SELECT board_no, board_title, board_user, board_date FROM board ORDER BY board_no DESC LIMIT ?, ?', 
                [beginRow, rowPerPage], 
                function(err, rs) {
                    if(err) {
                        console.log('쿼리 실행 실패: ' + err);
                        res.end();
                    } else {
                        console.log('목록: ' + JSON.stringify(rs));

                        // 내비게이션에 표시할 페이지 수
                        let navPerPage = 10;
		
		                // 내비게이션 첫번째 페이지
                        let navFirstPage = currentPage - (currentPage % navPerPage) + 1;

                        // 내비게이션 마지막 페이지
                        let navLastPage = navFirstPage + navPerPage - 1;
                        
                        // 10으로 나누어 떨어지는 경우 처리하는 코드
                        if (currentPage % navPerPage == 0 && currentPage != 0) {
                            navFirstPage = navFirstPage - navPerPage;
                            navLastPage = navLastPage - navPerPage;
                        }

                        // 현재 페이지에 대한 이전 페이지
                        let prePage;
                        if (currentPage > 10) {
                            prePage = currentPage - (currentPage % navPerPage) + 1 - 10;
                        } else {
                            prePage = 1;
                        }
                        
                        // 현재 페이지에 대한 다음 페이지
                        let nextPage = currentPage - (currentPage % navPerPage) + 1 + 10;
                        if (nextPage > lastPage) {
                            nextPage = lastPage;
                        }

                        console.log('currentPage: ' + currentPage);
                        model.currentPage = currentPage;

                        console.log('prePage: ' + prePage);
                        model.prePage = prePage;

                        console.log('nextPage: ' + nextPage);
                        model.nextPage = nextPage;
                        
                        console.log('lastPage: ' + lastPage);
                        model.lastPage = lastPage;

                        console.log('navFirstPage: ' + navFirstPage);
                        model.navFirstPage = navFirstPage;

                        console.log('navLastPage: ' + navLastPage);
                        model.navLastPage = navLastPage;

                        model.boardList = rs;

                        // 목록 Form
                        res.render('boardList', {model: model});                            // Java Forward: views/boardList.pug 뷰 파일 포워드
                    }
                }
            );
        }
    );
});

router.get('/boardOne', function(req, res) {
    let model = {};

    let boardNo;
    if (req.query.boardNo) {
        boardNo = parseInt(req.query.boardNo);
    }

    conn.query('SELECT board_no, board_title, board_user, board_date, board_content FROM board WHERE board_no = ?', 
        [boardNo], 
        function(err, rs) {
            if(err) {
                console.log('쿼리 실행 실패: ' + err);
                res.end();
            } else {
                console.log('내용: ' + JSON.stringify(rs));

                model.board = rs;

                // 내용 Form
                res.render('boardOne', {model: model});                            // Java Forward: views/boardList.pug 뷰 파일 포워드
            }
        }
    );

    res.render('boardOne', {model: model});                            // Java Forward: views/boardOne.pug 뷰 파일 포워드
});

// 설정된 라우터 미들웨어를 웹 서버에 확장(장착, 이용)
app.use('/', router);

// 80번 포트를 사용하는 웹 서버 실행
app.listen(80, function() {
  console.log('80 PORT OPEN');
});