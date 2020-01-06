const helpText = `
Welcome to Todo bot!

To add or view a todo, you can simply enter the name of it

To view all todos, enter "list"

To edit or delete a todo, enter "list" then choose the todo you want to edit or delete

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

If you only want to edit certain fields, you can enter those in any order.
For example:
R 2020/9/13 8:10

If you don't want to edit anything, enter "cancel"

To see advanced edit shortcut, enter "help edit" after finishing this edition.
`;

const advanceEditTodoHint = `
You can use number to represent the day after that number of days or the hour after that number of hours.
For example:
R 0 3
This sets the reminder to three hours later.
`;
module.exports = { helpText, editTodoHint, advanceEditTodoHint };
