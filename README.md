## Messenger TODO BOT

This is a Facebook messenger chatbots that can help you manage your todo list.

Messenger Link: [m.me/104448737749304](https://www.facebook.com/messages/t/104448737749304)

It works like a personal assistant that you can tell when should it remind you a todo by sending you a message as reminder. Also, you can simply set a daily reminder that allows it to send you a message containing all your todos everyday at a time you set.

### Functionality

- Add Todo
  - 3 ways to add a todo
    - Add with button on the persistent menu
    - Add with shortcut `/a someTodo`
    - Add directly by entering the name of it and bot will give you quick_replies options to add it
- Edit Todo
  - 3 ways to edit a todo
    - Edit right after adding a todo with quick_replies options
    - Edit after listing todos with button
    - Edit after viewing a todo
  - 4 properties of a todo:
    - Name
    - Reminder
    - Notes
- List Todos
  - 2 ways to list todos
    - List with button on the persistent menu
    - List with shorcut `list`
- View a Todo
  - 2 ways to view a todo
    - View directly by entering the name of it and bot will give you quick_replies options to View it
    - View with listing todos
- Reminder
  - You can set reminder of a todo or set a daily reminder that will remind you all your todos at the time you set every day

### Folder Structure

```
├── README.md
├── package.json
├── bottender.config.js
├── index.js
├── constant.js
├── utils.js
├── wording.js
└── reminder.js
```
