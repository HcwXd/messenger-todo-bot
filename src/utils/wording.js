const helpText = `
Welcome to Todo bot!

To add a todo, use "/a myTodoTitle"

To view todos, enter "/l"

To edit or delete a todo, enter "/l" then choose the todo you want to edit or delete

By clicking the edit button of a todo, you can add its
1. Reminder
2. Notes

Also, you can use the buttons on the menu to acheive the actions above

To set a daily reminder that will remind you all the todos you have, click Settings on the menu`;

const editTodoHint = `
To edit the todo title, enter in the following format:
T Some New Title

To edit the reminder, enter in following format:
R YYYY/M/D H:m

To edit the notes, enter in following format:
N Some notes here

For example:
T Call Jack and Bob
R 2019/12/1 13:15
N Remember to call Jack first

You can enter those in any order.

If you don't want to edit anything, enter "cancel"

To see advanced edit shortcut, enter "help edit" after finishing this edition.
`;

const advanceEditTodoHint = `
You can also set time in a relative number format.
For example:
R 0 3
This sets the reminder to three hours later today.

R 1 0
This sets the reminder to at the same time tomorrow.
`;
module.exports = { helpText, editTodoHint, advanceEditTodoHint };
