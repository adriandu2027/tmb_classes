from flask import Flask, jsonify, request
import requests
import time
import pandas as pd
import re
from datetime import time
from datetime import datetime, timedelta
import pytz
import xml.etree.ElementTree as ET
from xml.dom import minidom


app = Flask(__name__)

# read CSV file and store it as a global variable (initialized upon backend being started)
df_courses = pd.read_csv("./data/courses_2024_fall_cleaned.csv")

# convert a time string into a time object
def getTime(time_str):
    hr = int(time_str[0:2])
    min = int(time_str[3:5])
    tz = pytz.timezone("America/Chicago")
    time_obj = time(hr, min, 0, 0, tzinfo=tz)
    return time_obj

# convert a time object into a string object
def time_to_string(time):
    return time.strftime("%H:%M")

# get color of background of room cards for rooms that are currently open (red or green)
def get_status(next_used_time):
    # if the room is used within the next 30 min
    curr_time = datetime.now()
    next_30_min = curr_time + timedelta(minutes=30)
    next_30_min = next_30_min.time()
    if(next_30_min >= next_used_time):
        return "red"
    return "green"

# query by building
def getCoursesInBuilding(building, df):
    df_building = df[df["Building"] == building]
    return df_building

# query all classes that occur today
def getClassToday(df, curr_datetime):
    weekdays = ['M', 'T', 'W', 'R', 'F', 'S', 'S']
    day_of_week = weekdays[curr_datetime.weekday()]
    df_today = df[df["Days"].str.contains(day_of_week)]
    return df_today

# get all courses that are going on right now
def getClassNow(df, building):
    df = getCoursesInBuilding(building, df)

    curr_datetime = datetime.now()
    df_today = getClassToday(df, curr_datetime)
    # get all courses that going on right now
    curr_time = curr_datetime.time()
    df_now = df_today[(df_today["StartTime"].apply(lambda x: getTime(x)) <= curr_time) & (df_today["EndTime"].apply(lambda x: getTime(x)) >= curr_time)]
    return df_now

# return all courses that occur in the next hour
def getClassSoon(df, building):
    df = getCoursesInBuilding(building, df)

    curr_datetime = datetime.now()
    df_today = getClassToday(df, curr_datetime)
    # get all courses that start within the next hour
    curr_time = curr_datetime
    next_hr = curr_time + timedelta(minutes=60)
    next_hr = next_hr.time()
    df_soon = df_today[(df_today["StartTime"].apply(lambda x: getTime(x)) <= next_hr) & (df_today["EndTime"].apply(lambda x: getTime(x)) >= next_hr)]
    return df_soon

# get all rooms that are currently open as well as when they will be taken again
def getOpenNow(df, building):
    df = getCoursesInBuilding(building, df)

    # get all courses going on today
    curr_datetime = datetime.now()
    df_today = getClassToday(df, curr_datetime)
    # get all courses going on right now
    df_now = getClassNow(df, building)
    # create set of all rooms in the target building
    rooms = set(df["RoomNumber"].unique())
    # filter out all rooms that are not open
    rooms_used = set(df_now["RoomNumber"].unique())
    rooms_open = rooms - rooms_used
    # loop through classes in the building today and return the next course time for each open room
    rooms_next_used = {room: time(23, 59) for room in rooms_open}   # 11:59 means room is open for rest of day
    for idx, row in df_today.iterrows():
        startTime = getTime(row["StartTime"])
        rm_num = row["RoomNumber"]
        # if the room is currently open and this class will occur later in the day
        if((rm_num in rooms_open) & (startTime > curr_datetime.time())):
            # find the soonest course
            if(startTime < rooms_next_used[rm_num]):
                rooms_next_used[rm_num] = startTime
    # dictionary of pairs
    rooms_next_used_str = {room: (time_to_string(t), get_status(t)) for room, t in rooms_next_used.items()}
    return rooms_next_used_str

# returns true if there is a class at time in a specific room
def classAtTimeInRoom(time, df):
    for idx, row in df.iterrows():
        start_time = getTime(row["StartTime"])
        end_time = getTime(row["EndTime"])
        if((start_time <= time) & (time <= end_time)):
            return True
    return False


def getOpenSoon(df, building):
    df = getCoursesInBuilding(building, df)

    curr_datetime = datetime.now()
    df_today = getClassToday(df, curr_datetime)
    df_now = getClassNow(df, building)
    
    rooms_used = set(df_now["RoomNumber"].unique())
    rooms_next_open = {room: time(23, 59) for room in rooms_used}
    rooms_next_open = {row["RoomNumber"]: getTime(row["EndTime"]) for idx, row in df_now.iterrows()}
    rooms_next_open = {}

    # filter out all rooms that have the same class still going on in 30 minutes from now
    next_30_min = curr_datetime + timedelta(minutes=30)
    next_30_min = next_30_min.time()
    df_30_now = df_today[(df_today["StartTime"].apply(lambda x: getTime(x)) <= next_30_min) & (df_today["EndTime"].apply(lambda x: getTime(x)) >= next_30_min)]
    df_30_now_set = set(df_30_now["RoomNumber"].unique())   # all rooms with class in 30 minutes

    for idx, row in df_now.iterrows():
        rm_num = row["RoomNumber"]
        end_time = getTime(row["EndTime"])
        # filter out rooms that have same class still going on in 30 min from now
        if(rm_num in df_30_now_set):
            continue

        # filter out rooms that have another class right after (very inefficient to check but very rare)
        # this only runs if 30 minutes from now just happens to be the 10 minute gap in between classes in a room
        end_time_plus_30 = datetime.combine(datetime.today(), end_time) + timedelta(minutes=30)
        end_time_plus_30 = end_time_plus_30.time()  # 30 min after end of class
        # classes today, in specific building, in specific room
        df_room = df_today[df_today["RoomNumber"] == rm_num]
        if(classAtTimeInRoom(end_time_plus_30, df_room)):
            continue
        rooms_next_open[rm_num] = end_time

    rooms_next_open_str = {room: (time_to_string(t), "yellow") for room, t in rooms_next_open.items()}    
    return rooms_next_open_str

def getRooms(df, building):
    openNow = getOpenNow(df, building)
    openSoon = getOpenSoon(df, building)
    # ** is the dictionary unpacking operator
    rooms = {**openNow, **openSoon}
    return rooms


#### API ENDPOINTS

@app.route("/class_soon", methods=["GET"])
def class_soon():
    # request varaible is available globally within Flask app
    # query parameters in URL (?building=A) are accessible through request.args
    building = request.args.get("building")
    if building:
        result = getClassSoon(df_courses, building)
        # to_json is a pandas function, orient="records" formats JSON as a list of dictionaries (each row is a dictionary)
        return result.to_json(orient="records")
    return jsonify({"error": "Missing 'buliding' parameter"}), 400
    
@app.route("/class_now", methods=["GET"])
def class_now():
    building = request.args.get("building")
    if building:
        result = getClassNow(df_courses, building)
        return result.to_json(orient="records")
    return jsonify({"error": "Missing 'buliding' parameter"}), 400
    
@app.route("/open_now", methods=["GET"])
def open_now():
    building = request.args.get("building")
    if building:
        result = getOpenNow(df_courses, building)
        return jsonify(result)
    return jsonify({"error": "Missing 'buliding' parameter"}), 400

@app.route("/building_courses", methods=["GET"])
def building_courses():
    building = request.args.get("building")
    if building:
        result = getCoursesInBuilding(building, df_courses)
        return result.to_json(orient="records")
    return jsonify({"error": "Missing 'buliding' parameter"}), 400

@app.route("/building_names")
def building_names():
    # TODO: SORT THIS LIST BY DISTANCE FROM YOUR CURRENT LOCATION
    names = df_courses["Building"].unique().tolist()
    return jsonify(names)

@app.route("/open_rooms", methods=["GET"])
def open_rooms():
    building = request.args.get("building")
    if building:
        result = getRooms(df_courses, building)
        return jsonify(result)
    return jsonify({"error": "Missing 'buliding' parameter"}), 400


if __name__ == "__main__":
    app.run(debug=True, port = 5555)
