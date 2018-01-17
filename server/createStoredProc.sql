DROP PROCEDURE queryApproval;

DELIMITER //
CREATE PROCEDURE `queryApproval`(IN id int )
BEGIN

SELECT DisplayName, Markup.*
FROM Markup
INNER JOIN Users ON Markup.UserID=Users.UserID where ApprovalID = id;

END //
DELIMITER ;

CALL queryApproval(1);