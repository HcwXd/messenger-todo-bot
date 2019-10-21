const helpText = `
Welcome to Todo bot!

To add or view a todo, you can simply enter the name of it

To view all todos, enter "list"

To edit or delete a todo, enter "list" then choose the todo you want to edit or delete

By clicking the edit button of a todo, you can add its
1. Due Date
2. Reminder
3. Notes

Also, you can use the buttons on the menu to acheive the actions above

To set a daily reminder that will remind you all the todos you have, click Settings on the menu`;

const editTodoHint = `
To edit the todo title, enter in the following format:
T Some New Title

To edit the due date, enter in the following format:
D YYYY/MM/DD

To edit the reminder, enter in following format:
R YYYY/MM/DD HH:mm

To edit the notes, enter in following format:
N Some notes here

For example:
T Call Jack and Bob
D 2019/12/02
R 2019/12/01 13:00
N Remember to call Jack first

If you only want to edit certain fields, you can enter those in any order.
For example:
R 2020/01/01 13:00
D 2020/01/01

If you don't want to edit anything, enter "cancel"`;
module.exports = { helpText, editTodoHint };
