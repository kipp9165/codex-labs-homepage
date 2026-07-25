class RuntimeStateMachine:
    def __init__(self):
        self.state = "INIT"

    def transition(self, event):
        if self.state == "INIT" and event == "BOOT":
            self.state = "RUNNING"
        elif self.state == "RUNNING" and event == "SHUTDOWN":
            self.state = "TERMINATED"
        return self.state